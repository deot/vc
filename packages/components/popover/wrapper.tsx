/** @jsxImportSource vue */

import {
	defineComponent,
	getCurrentInstance,
	ref,
	computed,
	onMounted,
	onUnmounted
} from 'vue';
import { Resize } from '@deot/helper-resize';
import { throttle, isEqual } from 'lodash-es';
import type { ComponentInternalInstance } from 'vue';
import type { PopoverWrapperStyle } from './types';
import { props as popoverWrapperProps } from './wrapper-props';
import usePos, { getClip, fitMaxSize } from './use-pos';
import { setTrigger, isInArea } from './utils';
import { TransitionScale } from '../transition';
import { Customer } from '../customer';
import { Portal } from '../portal';
import { getScroller } from '../scroller/utils';

const COMPONENT_NAME = 'vc-popover-wrapper';

export const PopoverWrapper = defineComponent({
	name: COMPONENT_NAME,
	props: popoverWrapperProps,
	emits: ['portal-fulfilled', 'close'],
	setup(props, { emit, slots, expose }) {
		const {
			getPopupStyle,
			getFitPos,
			getRect
		} = usePos();
		const instance = getCurrentInstance() as (ComponentInternalInstance & { vnode: any });
		const { vnode } = instance;
		const isActive = ref(false);
		const wrapperStyle = ref({} as PopoverWrapperStyle);
		const arrowStyle = ref({});
		const fitPos = ref(props.placement);
		const wrapperW = ref({ width: 'auto' });
		const containerRef = ref<HTMLElement>();
		// 触发节点所在的滚动容器（由内到外，不含 window），见 bindScrollers
		const scrollers: HTMLElement[] = [];

		const themeClasses = computed(() => {
			return {
				'is-light': /light/.test(props.theme),
				'is-dark': /dark/.test(props.theme),
			};
		});

		// 只按主方向：箭头所在一侧留出 padding（如 top-left 只算 top，否则右侧也会多出 8px，内容区比预期窄）
		const wrapperClasses = computed(() => {
			const main = fitPos.value.split('-')[0];
			return {
				'is-top': props.arrow && main === 'top',
				'is-right': props.arrow && main === 'right',
				'is-bottom': props.arrow && main === 'bottom',
				'is-left': props.arrow && main === 'left',
			};
		});

		const posClasses = computed(() => {
			return {
				[`is-${fitPos.value.split('-')[0]}-basic`]: true,
				[`is-${fitPos.value}`]: true
			};
		});

		// hack 外层高度没有撑开时
		const getHackContainer = () => {
			let container = props.triggerEl!;
			try {
				if (
					slots.content
					&& container.children.length === 1
				) {
					const hackEl = container.children[0];
					const slotHeight = hackEl.getBoundingClientRect().height;
					const parentHeight = container.getBoundingClientRect().height;
					if (slotHeight > parentHeight) {
						container = hackEl;
					}
				}
				return container;
			} catch {
				return container;
			}
		};

		// alone 时 hover 移入 / 移出的延时，见 handleTriggerChange
		let timer: any;

		/**
		 * 关闭：alone 时由弹层自身关闭，并通知调用方（Popover 组件据此同步 v-model）
		 * @param e 事件
		 * @param options ~
		 * @param options.visible 为 undefined 时按外部点击处理（见 Popover 的 handleChange）
		 * @param options.immediate 不走 hover 的延时关闭
		 */
		const close = (e: any, options: { visible?: boolean; immediate?: boolean } = {}) => {
			clearTimeout(timer);
			props.alone && (isActive.value = false);
			props.onChange(e, { ...options, context: instance });
		};

		/**
		 * 触发节点已被移除（如列表按 key 重新渲染、调用方卸载）：不再定位，直接关闭
		 * 否则弹层残留，且按全 0 的位置跳到页面左上角；移除的节点也不会再触发 mouseleave
		 */
		let isTriggerRemoved = false;
		const handleTriggerRemoved = () => {
			if (isTriggerRemoved) return;
			isTriggerRemoved = true;
			close({}, { visible: false, immediate: true });
		};

		/**
		 * 节流合并连续的计算（滚动、尺寸变化）
		 * 需保留最后一次（trailing）：内容在短时间内连续变化（如图片加载）时，最后一次的尺寸才是准的
		 */
		const setPopupStyle = throttle(() => {
			if (!vnode.el) return;
			if (!props.triggerEl!.isConnected) return handleTriggerRemoved();

			const triggerEl = getHackContainer();
			const triggerRect = triggerEl.getBoundingClientRect();
			const { hidden, viewport, boundary } = getClip(scrollers, triggerRect);

			const { portal, getPopupContainer } = props;

			const rect = getRect({
				portal,
				triggerEl,
				el: vnode.el,
				hasContainer: !!getPopupContainer
			});

			// 挂在 body 上的 hover 弹层（提示等）只按视口翻转：不受容器裁剪，而朝下翻转会挡住向下移动的鼠标（如 Table 前几行）
			// 其余弹层按容器可视区翻转：click 弹层（下拉）尽量留在容器内，挂在容器内的弹层会被容器裁剪
			const inBody = props.portal && !getPopupContainer;
			const fit = () => getFitPos({
				triggerEl,
				el: vnode.el,
				placement: props.placement,
				boundary: props.hover && inBody ? viewport : boundary
			});
			// 内容区尺寸不超过实际方向所在一侧的可用空间
			const result = fitMaxSize(containerRef.value!, { el: vnode.el, placement: props.placement, triggerRect, fit });

			const { wrapperStyle: $wrapperStyle, arrowStyle: $arrowStyle } = getPopupStyle({
				rect,
				triggerEl,
				el: vnode.el,
				placement: result
			});
			// 触发节点滚出滚动容器可视区时隐藏（不关闭），滚回后恢复
			hidden && ($wrapperStyle.visibility = 'hidden');

			// 结果不变时不赋新对象，避免滚动时每帧重新渲染弹层内容
			fitPos.value = result;
			isEqual(wrapperStyle.value, $wrapperStyle) || (wrapperStyle.value = $wrapperStyle);
			isEqual(arrowStyle.value, $arrowStyle) || (arrowStyle.value = $arrowStyle);
			// 自适应高度
			if (props.autoWidth) return;
			const width = `${triggerEl!.getBoundingClientRect().width}px`;
			wrapperW.value.width !== width && (wrapperW.value = { width });
		}, 16);

		let isPressMouse = false;
		const handleTriggerChange = (e: Event) => {
			const visible = e.type === 'mouseenter';

			timer && clearTimeout(timer);
			timer = setTimeout(() => {
				isActive.value = visible;
				props.onChange(e, { visible, context: instance });
			}, 200);
		};

		const handleMouseDown = () => {
			isPressMouse = true;
		};

		/**
		 * 不会销毁的两种情况
		 * 1. 在容器内的点击（含触发节点在容器内的子弹层，如内容区内嵌的 Select 下拉）
		 * 2. 内部按下，外部释放
		 * @param e ~
		 */
		const handleClick = (e: Event) => {
			const isIn = isInArea(e, vnode.el);
			const isPress = isPressMouse;

			isPressMouse = false;
			if (isIn || isPress) {
				return;
			}

			close(e);
		};

		const handleChange = (e: Event, { visible }) => {
			props.alone && handleTriggerChange(e);
			!props.alone && props.onChange(e, { visible, context: instance });
		};

		/**
		 * 动画执行后关闭
		 * 同时close兼容portal设计
		 */
		const handleRemove = () => {
			!instance.isUnmounted && (
				emit('close'),
				emit('portal-fulfilled')
			);
		};

		/**
		 * for alone, 方法直接调用
		 */
		const bindEvents = () => {
			props.triggerEl!.addEventListener('mouseenter', handleTriggerChange);
			props.triggerEl!.addEventListener('mouseleave', handleTriggerChange);
		};
		const removeEvents = () => {
			props.triggerEl!.removeEventListener('mouseenter', handleTriggerChange);
			props.triggerEl!.removeEventListener('mouseleave', handleTriggerChange);
		};

		props.alone && props.hover && bindEvents();

		/**
		 * 滚动容器滚动时
		 * 	- hover 弹层立即关闭：跟随滚动会滑到静止的鼠标下并截住滚轮（如 Table 向上滚动），且此时用户在滚动而不是查看弹层
		 * 	- click 弹层（下拉）跟随重新定位
		 * @param e ~
		 */
		const handleScrollerScroll = (e: Event) => {
			if (!props.hover) {
				setPopupStyle();
			} else if (isActive.value) {
				close(e, { visible: false, immediate: true });
			}
		};

		/**
		 * 触发节点所在的滚动容器（逐层向上，不含 window，window 由 document 的 scroll 处理）
		 * 如 Modal、Table、Scroller；Scroller 滚轮驱动时为 overflow: hidden，getScroller 按 class 识别；滚动时的处理见 handleScrollerScroll
		 */
		const bindScrollers = () => {
			let scroller = getScroller(props.triggerEl?.parentNode);
			while (scroller instanceof HTMLElement) {
				scrollers.push(scroller);
				scroller.addEventListener('scroll', handleScrollerScroll);
				scroller = getScroller(scroller.parentNode);
			}
		};
		const unbindScrollers = () => {
			scrollers.forEach(i => i.removeEventListener('scroll', handleScrollerScroll));
		};

		onMounted(() => {
			isActive.value = true;
			// 登记触发节点，供外层弹层判断点击区域
			setTrigger(vnode.el, props.triggerEl as Element);
			// 捕获阶段执行
			!props.hover && document.addEventListener('click', handleClick, true);
			// 监听body的滚动
			document.addEventListener('scroll', setPopupStyle);
			// 监听触发节点所在滚动容器的滚动
			bindScrollers();
			// 监听触发节点的Resize（节点被移除时尺寸变为 0 也会回调，见 handleTriggerRemoved）
			Resize.on(props.triggerEl as any, setPopupStyle);
			// 监听弹层的Resize（如 Cascader 展开、图片加载）；弹层节点每次新建，首次回调即完成挂载后的定位
			Resize.on(vnode.el, setPopupStyle);

			props.onReady && props.onReady();
		});

		onUnmounted(() => {
			clearTimeout(timer);
			setPopupStyle.cancel();
			!props.hover && document.removeEventListener('click', handleClick, true);
			document.removeEventListener('scroll', setPopupStyle);
			unbindScrollers();
			Resize.off(props.triggerEl as any, setPopupStyle);
			Resize.off(vnode.el, setPopupStyle);

			props.alone && props.hover && removeEvents();
		});

		expose({
			isActive,
			toggle(v?: boolean) {
				v = typeof v === 'boolean' ? v : !isActive.value;
				isActive.value = v;
			}
		});
		return () => {
			return (
				<TransitionScale
					mode={props.animation || 'part'}
					duration={{ enter: 300, leave: 150 }}
					// @ts-ignore
					onAfterLeave={handleRemove}
				>
					{
						<div
							// @ts-ignore
							vShow={isActive.value}
							style={[wrapperStyle.value, wrapperW.value, props.portalStyle]}
							class={[wrapperClasses.value, props.portalClass, 'vc-popover-wrapper']}
							onMousedown={() => !props.hover && handleMouseDown()}
							onMouseenter={e => props.hover && handleChange(e, { visible: true })}
							onMouseleave={e => props.hover && handleChange(e, { visible: false })}
						>
							<div ref={containerRef} class={[themeClasses.value, 'vc-popover-wrapper__container']}>
								{
									props.arrow && (
										<div
											style={arrowStyle.value}
											class={[themeClasses.value, posClasses.value, 'vc-popover-wrapper__arrow']}
										/>
									)
								}
								{
									slots.content
										? slots.content()
										: typeof props.content === 'function'
											? (
													<Customer
														// @ts-ignore
														render={props.content}
													/>
												)
											: <div innerHTML={props.content} />
								}
							</div>
						</div>
					}
				</TransitionScale>

			);
		};
	}
});

export const PopoverPortal = new Portal(PopoverWrapper, { leaveDelay: 0 });
