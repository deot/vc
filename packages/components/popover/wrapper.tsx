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
import { debounce } from 'lodash-es';
import type { ComponentInternalInstance } from 'vue';
import type { PopoverWrapperStyle } from './types';
import { props as popoverWrapperProps } from './wrapper-props';
import usePos from './use-pos';
import { TransitionScale } from '../transition';
import { Customer } from '../customer';
import { Portal } from '../portal';

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
		 * 添加debounce解决连续setPopupStyle的情况
		 * 待排查
		 */
		const setPopupStyle = debounce(() => {
			if (!vnode.el) return;

			const triggerEl = getHackContainer();

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
				placement: props.placement
			});

			const { wrapperStyle: $wrapperStyle, arrowStyle: $arrowStyle } = getPopupStyle({
				rect,
				triggerEl,
				el: vnode.el,
				placement: result
			});

			fitPos.value = result;
			wrapperStyle.value = $wrapperStyle;
			arrowStyle.value = $arrowStyle;
			// 自适应高度
			if (props.autoWidth) return;
			wrapperW.value = {
				width: `${triggerEl!.getBoundingClientRect().width}px`
			};
		}, 50, { leading: true, trailing: false });

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
		 * 1. 在容器内的点击
		 * 2. 内部按下，外部释放
		 * @param e ~
		 */
		const handleClick = (e: Event) => {
			const isIn = vnode.el.contains(e.target);
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
		 * 弹层【宽度】变化后的自适应，主要服务于Cascader等内容会变化的下拉框
		 */
		const handleWrapperResize = () => {
			const direction = props.placement.split('-');

			const left = parseFloat(wrapperStyle.value.left);
			switch (direction[0]) {
				case 'top':
				case 'bottom':
					if (left + vnode.el.offsetWidth > window.innerWidth) {
						wrapperStyle.value = {
							...wrapperStyle.value,
							left: `${window.innerWidth - vnode.el.offsetWidth}px`
						};
					} else {
						setPopupStyle();
					}
					break;
				default:
					break;
			}
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

		onMounted(() => {
			isActive.value = true;
			// 捕获阶段执行
			!props.hover && document.addEventListener('click', handleClick, true);
			// 监听body的滚动
			document.addEventListener('scroll', setPopupStyle);
			// 监听触发节点的Resize
			Resize.on(props.triggerEl as any, setPopupStyle); // 首次会执行一次
			// 监听弹层的Resize
			Resize.on(vnode.el, handleWrapperResize); // 首次会执行一次

			props.onReady && props.onReady();
		});

		onUnmounted(() => {
			!props.hover && document.removeEventListener('click', handleClick, true);
			document.removeEventListener('scroll', setPopupStyle);
			Resize.off(props.triggerEl as any, setPopupStyle);
			Resize.off(vnode.el, handleWrapperResize);

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
