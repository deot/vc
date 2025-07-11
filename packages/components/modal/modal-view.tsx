/** @jsxImportSource vue */

import {
	ref,
	shallowRef,
	watch,
	computed,
	defineComponent,
	onMounted,
	onUnmounted,
	onBeforeUnmount,
	onUpdated,
	getCurrentInstance,
	Fragment
} from 'vue';
import { debounce } from 'lodash-es';
import { IS_SERVER } from '@deot/vc-shared';
import { Resize } from '@deot/helper-resize';
import { useScrollbar } from '@deot/vc-hooks';

import { Icon } from '../icon';
import { Button } from '../button';
import { TransitionScale, TransitionFade } from '../transition';
import { Customer } from '../customer';
import { Scroller } from '../scroller';
import { Resizer } from '../resizer';
import { VcInstance } from '../vc';

import { props as modalProps } from './modal-view-props';

const COMPONENT_NAME = 'vc-modal';
let zIndexNumber = 1002;

export const ModalView = defineComponent({
	name: COMPONENT_NAME,
	emits: ['update:modelValue', 'close', 'portal-fulfilled', 'visible-change', 'ok', 'cancel'],
	props: modalProps,
	setup(props, { slots, emit, expose }) {
		const instance = getCurrentInstance()!;
		// $refs
		const container = shallowRef<HTMLElement>();
		const wrapper = shallowRef<HTMLElement>();
		const header = shallowRef<HTMLElement>();
		const scroller = shallowRef<any>();
		const resizer = shallowRef<any>();

		const x = ref(props.x!);
		const y = ref(props.y!);
		const isActive = ref(false);

		// 注: 服务端渲染为0, 在客服端激活前，展示端存在问题【高度不定】
		const MAX_HEIGHT = IS_SERVER ? 0 : window.innerHeight - 20;
		const MAX_WIDTH = IS_SERVER ? 0 : window.innerWidth - 20;
		const defaultSize = computed(() => {
			let width = 0;
			let height = 0;
			switch (props.size) {
				case 'small':
					width = props.mode ? 340 : 480;
					height = props.mode ? 154 : 296;
					break;
				case 'medium':
					width = 640;
					height = 502;
					break;
				case 'large':
					width = props.mode ? 390 : 864;
					height = props.mode ? 198 : 662;
					break;
				default:
					break;
			}
			return {
				width: Math.min(props.width || width, MAX_WIDTH),
				height: Math.min(props.height || height, MAX_HEIGHT)
			};
		});

		const basicStyle = computed(() => {
			const result: any = {
				width: `${defaultSize.value.width}px`,
				maxHeight: `${MAX_HEIGHT}px`,
			};

			if (props.height) {
				result.height = `${defaultSize.value.height}px`;
			} else {
				result.minHeight = `${defaultSize.value.height}px`;
			}

			return result;
		});

		const draggableStyle = computed(() => {
			if (IS_SERVER || !props.draggable) return {};

			const left = typeof x.value === 'undefined' ? window.innerWidth / 2 - defaultSize.value.width / 2 : x.value;
			const top = typeof y.value === 'undefined' ? window.innerHeight / 2 - defaultSize.value.height / 2 : y.value;

			return {
				left: `${left}px`,
				top: `${top}px`,
			};
		});

		useScrollbar(isActive);

		let startX = 0;
		let startY = 0;
		// Portal调用时，可作为初始值
		let originX = VcInstance.globalEvent.x;
		let originY = VcInstance.globalEvent.y;

		/**
		 * 设置原始坐标
		 */
		const resetOrigin = debounce(function () {
			const el = container.value;

			if (!el) return;

			let $x = 0;
			let $y = 0;
			/**
			 * 拖拽使用x, y
			 * 其他正常的布局
			 */
			const modalX = x.value || el.offsetLeft;
			const modalY = y.value || el.offsetTop || (window.screen.height - el.clientHeight) / 2;

			$x = originX - modalX;
			$y = originY - modalY;

			el.style.transformOrigin = `${$x}px ${$y}px 0`;
		}, 250, { leading: true });

		const isTransitionEnd = ref(false);
		const handleBeforeEnter = () => {
			isTransitionEnd.value = false;
		};

		const handleEnter = () => {
			resetOrigin();
		};
		const handleAfterEnter = () => {
			isTransitionEnd.value = true;
			resizer.value.refresh();
		};
		/**
		 * 动画执行后关闭, 关闭事件都会被执行
		 * visible-change 由移除之后触发
		 * 同时portal-fulfilled兼容portal设计
		 */
		const handleRemove = () => {
			!instance.isUnmounted && (
				emit('close'),
				emit('portal-fulfilled'),
				emit('update:modelValue', false),
				emit('visible-change', false)
			);
		};

		const handleBefore = (e: any, hook: any) => {
			if (!isActive.value) return;

			const fn = hook && hook(e);
			if (fn && fn.then) {
				return fn
					.then((res: any) => {
						isActive.value = false;
						return res;
					});
			} else if (!fn || fn === true) {
				isActive.value = false;
			}
		};

		// 用户点击确定的回调 兼容portal设计
		const handleOk = (...rest: any[]) => {
			const ok = instance.vnode.props?.onOk || props.onOk || (() => {});

			return ok(...rest);
		};

		// 用户点击取消按钮时为取消 兼容portal设计
		const handleCancel = (...rest: any[]) => {
			const cancel = instance.vnode.props?.onCancel || props.onCancel || (() => {});

			return cancel(...rest);
		};

		// 关闭事件
		const handleClose = (e: any, closable: boolean) => {
			if (closable
				|| (
					props.maskClosable
					&& e.target?.classList?.contains('vc-modal__wrapper')
				)
			) {
				// 用户主要取消与关闭事件关联
				if (props.closeWithCancel) {
					handleBefore(e, handleCancel);
				} else {
					isActive.value = false;
				}
			}
		};
		const handleEscClose = (e: KeyboardEvent) => {
			if (e.code === 'Escape' && props.escClosable && isActive.value) {
				handleClose(e, true);
			}
		};

		// 当高度为基数时，解决模糊的问题
		const handleContainerResize = () => {
			const $container = container.value!;
			const maxheight = window.innerHeight - 20;
			const containerHeight = $container.offsetHeight;
			if (containerHeight + 1 > maxheight) {
				if (maxheight % 2 !== 0) {
					$container.style.height = `${maxheight - 1}px`;
				}
			} else if (containerHeight % 2 !== 0) {
				$container.style.height = `${containerHeight + 1}px`;
			}
		};

		/**
		 * content变化, 由于容器是maxHeight, 这里需要重匹配高度
		 *
		 * 这里由于scroller的resize时，render会重置height(实际上就是保留height, 无法移除)
		 * 1. 改用nextTick, 抖动严重
		 * 2. resizer.value.refresh, 不抖动
		 *
		 * container在最大值时，需要移除，宽度才会缩回去
		 */
		const handleContentResize = () => {
			if (props.height) return;
			const needRefreshScroller = !!scroller.value.wrapper!.style.getPropertyValue('height');
			const needRefreshContainer = !!container.value!.style.getPropertyValue('height');

			needRefreshContainer && container.value!.style.removeProperty('height');
			needRefreshScroller && scroller.value.wrapper!.style.removeProperty('height');
			needRefreshScroller && resizer.value.refresh();
		};

		const handleClick = (e: MouseEvent) => {
			// isActive click先触发,后设置后
			if (props.draggable && isActive.value && originX) return;
			originX = e.x;
			originY = e.y;
		};

		const handleMouseMove = (e: MouseEvent) => {
			x.value += e.clientX - startX;
			y.value += e.clientY - startY;
			startX = e.clientX;
			startY = e.clientY;
		};
		/**
		 * 松开鼠标时清除move和up事件
		 */
		const handleMouseUp = () => {
			/**
			 * 放手后重新设置原点
			 */
			resetOrigin();

			document.removeEventListener('mousemove', handleMouseMove);
			document.removeEventListener('mouseup', handleMouseUp);
		};

		const handleMouseDown = (e: MouseEvent) => {
			if (!props.draggable) {
				return;
			}
			const $container = container.value!;
			const $wrapper = wrapper.value!;
			const $header = header.value!;
			const rect = $container!.getBoundingClientRect();
			$header.style.cursor = 'move';
			zIndexNumber += 1;
			$wrapper.style.zIndex = `${zIndexNumber}`;
			x.value = rect.x || rect.left;
			y.value = rect.y || rect.top;

			startX = e.clientX;
			startY = e.clientY;

			document.addEventListener('mousemove', handleMouseMove);
			document.addEventListener('mouseup', handleMouseUp);
		};

		onMounted(() => {
			document.addEventListener('keydown', handleEscClose);
			document.addEventListener('click', handleClick, true);
			Resize.on(container.value!, handleContainerResize);
			Resize.on(scroller.value!.content, handleContentResize);
		});

		onUpdated(() => {
			/**
			 * 非拖动状态下, 外部,会触发设置初始值
			 */
			!props.draggable && isActive.value && resetOrigin();
		});

		onBeforeUnmount(() => {
			Resize.off(container.value!, handleContainerResize);
			Resize.off(scroller.value!.content, handleContentResize);
		});

		onUnmounted(() => {
			document.removeEventListener('click', handleClick, true);
			document.removeEventListener('keydown', handleEscClose);
			document.removeEventListener('mousemove', handleMouseMove);
			document.removeEventListener('mouseup', handleMouseUp);
		});

		watch(
			() => props.modelValue,
			(v) => {
				isActive.value = v;
			},
			{ immediate: true }
		);

		expose({
			isActive, // for portal
			toggle(v?: boolean) {
				v = typeof v === 'boolean' ? v : !isActive.value;
				isActive.value = v;
			},
			resetOrigin
		});
		return () => {
			return (
				<div class="vc-modal">
					<TransitionFade delay={40}>
						<div
							v-show={props.mask && isActive.value}
							class="vc-modal__mask"
							// @ts-ignore
							onClick={e => handleClose(e, props.maskClosable)}
						/>
					</TransitionFade>
					<div
						ref={wrapper}
						style={[props.wrapperStyle || {}, props.draggable ? { top: 0 } : {}]}
						class={[props.wrapperClass, 'vc-modal__wrapper']}
						// @ts-ignore
						onClick={e => handleClose(e, false)}
					>
						<TransitionScale
							mode="part"
							// @ts-ignore
							onBeforeEnter={handleBeforeEnter}
							onEnter={handleEnter}
							onAfterEnter={handleAfterEnter}
							onAfterLeave={handleRemove}
						>
							<div
								v-show={isActive.value}
								ref={container}
								class={[
									{
										'is-drag': props.draggable,
										'is-large': props.size === 'large' || props.size === 'medium',
										'has-footer': props.footer && (props.cancelText || props.okText),
										'has-border': props.border,
									},
									'vc-modal__container'
								]}
								style={[basicStyle.value, draggableStyle.value]}
							>
								<div
									ref={header}
									class={[{ 'is-confirm': props.mode }, 'vc-modal__header']}
									// @ts-ignore
									onMousedown={handleMouseDown}
								>
									{
										props.mode && (
											<Icon
												type={props.mode}
												class={[`is-${props.mode}`, 'vc-modal__icon']}
											/>
										)
									}
									{
										!slots.header
											? (
													<Fragment>
														<div
															class="vc-modal__title"
															innerHTML={props.title}
														/>
														{
															props.closable && !props.mode && (
																<div
																	class="vc-modal__close"
																	onClick={e => handleClose(e, true)}
																>
																	<Icon type="close" />
																</div>
															)
														}

													</Fragment>
												)
											: slots.header()
									}
								</div>
								<Resizer ref={resizer} class="vc-modal__content-container">
									{{
										default: (row: any) => {
											return (
												<Scroller
													ref={scroller}
													native={false}
													always={false}
													height={isTransitionEnd.value ? row.height : (void 0)}
													contentClass={[{ 'is-confirm': props.mode }, props.contentClass, 'vc-modal__content']}
													contentStyle={props.contentStyle}
												>
													{
														typeof props.content === 'string'
															? (<div innerHTML={props.content} />)
															: typeof props.content === 'function'
																? (<Customer render={props.content} />)
																: null
													}
													{ slots.default?.() }
												</Scroller>
											);
										}
									}}
								</Resizer>
								{
									(props.footer && (props.cancelText || props.okText)) && (
										<div class={[{ 'is-confirm': props.mode }, 'vc-modal__footer']}>
											{ slots['footer-extra']?.() }
											{
												!slots.footer
													? (
															<Fragment>
																{
																	props.cancelText && (
																		<Button
																			style="margin-right: 8px;"
																			disabled={props.cancelDisabled}
																			onClick={e => handleBefore(e, handleCancel)}
																		>
																			{ props.cancelText }
																		</Button>
																	)
																}
																{
																	props.okText && (
																		<Button
																			type="primary"
																			disabled={props.okDisabled}
																			onClick={e => handleBefore(e, handleOk)}
																		>
																			{ props.okText }
																		</Button>
																	)
																}
															</Fragment>
														)
													: slots.footer?.()
											}
										</div>
									)
								}
							</div>
						</TransitionScale>
					</div>
				</div>
			);
		};
	}
});
