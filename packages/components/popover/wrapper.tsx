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
import usePos, { getClip } from './use-pos';
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
		// 触发节点所在的滚动容器（由内到外，不含 window），见 bindScrollers
		const scrollers: HTMLElement[] = [];

		const themeClasses = computed(() => {
			return {
				'is-light': /light/.test(props.theme),
				'is-dark': /dark/.test(props.theme),
			};
		});

		const wrapperClasses = computed(() => {
			return {
				'is-top': props.arrow && /top/.test(fitPos.value),
				'is-right': props.arrow && /right/.test(fitPos.value),
				'is-bottom': props.arrow && /bottom/.test(fitPos.value),
				'is-left': props.arrow && /left/.test(fitPos.value),
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

		/**
		 * 触发节点已被移除（如列表按 key 重新渲染、调用方卸载）：不再定位，直接关闭
		 * 否则弹层残留，且按全 0 的位置跳到页面左上角；移除的节点也不会再触发 mouseleave
		 */
		let isTriggerRemoved = false;
		const handleTriggerRemoved = () => {
			if (isTriggerRemoved) return;
			isTriggerRemoved = true;
			props.alone && (isActive.value = false);
			props.onChange({}, { visible: false, context: instance });
		};

		/**
		 * 节流合并连续的计算（滚动、尺寸变化）
		 * 需保留最后一次（trailing）：内容在短时间内连续变化（如图片加载）时，最后一次的尺寸才是准的
		 */
		const setPopupStyle = throttle(() => {
			if (!vnode.el) return;
			if (!props.triggerEl!.isConnected) return handleTriggerRemoved();

			const triggerEl = getHackContainer();
			const { hidden, boundary } = getClip(scrollers, triggerEl.getBoundingClientRect());

			const { portal, getPopupContainer } = props;

			const rect = getRect({
				portal,
				triggerEl,
				el: vnode.el,
				hasContainer: !!getPopupContainer
			});

			const result = getFitPos({
				triggerEl,
				el: vnode.el,
				placement: props.placement,
				boundary
			});

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

		let timer: any;
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

			props.alone && (isActive.value = false);
			props.onChange(e, { context: instance });
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
		 * 触发节点所在的滚动容器（逐层向上，不含 window，window 由 document 的 scroll 处理）
		 * 如 Modal、Table、Scroller 内滚动时重新定位；Scroller 滚轮驱动时为 overflow: hidden，getScroller 按 class 识别
		 */
		const bindScrollers = () => {
			let scroller = getScroller(props.triggerEl?.parentNode);
			while (scroller instanceof HTMLElement) {
				scrollers.push(scroller);
				scroller.addEventListener('scroll', setPopupStyle);
				scroller = getScroller(scroller.parentNode);
			}
		};
		const unbindScrollers = () => {
			scrollers.forEach(i => i.removeEventListener('scroll', setPopupStyle));
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
							<div class={[themeClasses.value, 'vc-popover-wrapper__container']}>
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
