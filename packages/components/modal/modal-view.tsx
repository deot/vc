/** @jsxImportSource vue */

import {
	ref,
	shallowRef,
	watch,
	computed,
	defineComponent,
	getCurrentInstance,
	Fragment
} from 'vue';
import { useScrollbar, useDrag, useKeyboard } from '@deot/vc-hooks';
import type { DragPoint } from '@deot/vc-hooks';

import { Icon } from '../icon';
import { Button } from '../button';
import { TransitionReveal } from '../transition';
import { Customer } from '../customer';
import { Scroller } from '../scroller';
import { useLocale } from '../locale';

import { props as modalProps } from './modal-view-props';

const COMPONENT_NAME = 'vc-modal';
// 宽高上限：视口减去留白（四周各 10px）。wrapper 铺满视口，百分比即相对视口，随窗口变化
const MAX_SIZE = '100% - 20px';
let zIndexNumber = 1002;

export const ModalView = defineComponent({
	name: COMPONENT_NAME,
	emits: ['update:modelValue', 'close', 'portal-fulfilled', 'visible-change', 'ok', 'cancel'],
	props: modalProps,
	setup(props, { slots, emit, expose }) {
		const instance = getCurrentInstance()!;
		const { t } = useLocale();
		// $refs
		const container = shallowRef<HTMLElement>();
		const wrapper = shallowRef<HTMLElement>();
		const maskElement = shallowRef<HTMLElement>();
		const header = shallowRef<HTMLElement>();

		const x = ref(props.x!);
		const y = ref(props.y!);
		const isActive = ref(false);
		// 蒙层打开时显示，弹窗缩回结束才隐藏；透明度由弹窗的 TransitionReveal 带着一起淡入淡出
		const isMaskShown = ref(false);
		const okText = computed(() => {
			return typeof props.okText === 'undefined'
				? t('vc.Modal.okButtonText')
				: props.okText;
		});
		const cancelText = computed(() => {
			return typeof props.cancelText === 'undefined'
				? t('vc.Modal.cancelButtonText')
				: props.cancelText;
		});

		// height：数字为固定高度；'auto' 跟随内容；不传时以预设高度为最小高度
		const isFixedHeight = computed(() => typeof props.height === 'number' && props.height > 0);
		const isAutoHeight = computed(() => props.height === 'auto');
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
				width: props.width || width,
				height: isFixedHeight.value ? (props.height as number) : height
			};
		});

		const basicStyle = computed(() => {
			const { width, height } = defaultSize.value;
			const result: any = {
				width: `${width}px`,
				maxWidth: `calc(${MAX_SIZE})`,
				maxHeight: `calc(${MAX_SIZE})`,
			};

			if (isFixedHeight.value) {
				result.height = `${height}px`;
			} else if (!isAutoHeight.value) {
				// min-height 优先于 max-height，预设高度需与上限取小
				result.minHeight = `min(${height}px, ${MAX_SIZE})`;
			}

			return result;
		});

		// 未指定且未拖动过的方向不设置，由 wrapper 按容器的实际尺寸居中
		const draggableStyle = computed(() => {
			if (!props.draggable) return {};

			return {
				left: typeof x.value === 'undefined' ? undefined : `${x.value}px`,
				top: typeof y.value === 'undefined' ? undefined : `${y.value}px`,
			};
		});

		useScrollbar(isActive);

		let startX = 0;
		let startY = 0;

		/**
		 * 动画执行后关闭, 关闭事件都会被执行
		 * visible-change 由移除之后触发
		 * 同时portal-fulfilled兼容portal设计
		 */
		const handleRemove = () => {
			isMaskShown.value = false;
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
			if (!closable) return;
			// 用户主要取消与关闭事件关联
			if (props.closeWithCancel) {
				handleBefore(e, handleCancel);
			} else {
				isActive.value = false;
			}
		};
		// 由统一的 Keyboard 分发：后打开的弹层先处理，处理后不再传给下层（如下层的 Modal）
		const handleEscClose = (e: KeyboardEvent) => {
			if (e.isComposing || !(e.code === 'Escape' || e.key === 'Escape') || !props.escClosable) return false;
			handleClose(e, true);
			return true;
		};
		useKeyboard({ enabled: () => isActive.value, handler: handleEscClose, flush: 'post' });

		const renderContent = () => {
			return (
				<Fragment>
					<Customer render={props.content} />
					{ slots.default?.() }
				</Fragment>
			);
		};

		const handleMouseMove = (e: DragPoint) => {
			x.value += e.clientX - startX;
			y.value += e.clientY - startY;
			startX = e.clientX;
			startY = e.clientY;
		};

		const handleMouseDown = (e: DragPoint) => {
			if (!props.draggable) {
				return false;
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
			return true;
		};

		// 标题栏拖动只用鼠标；位置随拖动即时生效
		const drag = useDrag({
			start: (_, point) => handleMouseDown(point),
			move: (_, point) => handleMouseMove(point)
		});

		watch(
			() => props.modelValue,
			(v) => {
				isActive.value = v;
			},
			{ immediate: true }
		);

		// 同步置上：与弹窗同一次渲染里显示，展开的第一帧蒙层就在
		watch(isActive, v => v && (isMaskShown.value = true), { flush: 'sync', immediate: true });

		expose({
			isActive, // for portal
			toggle(v?: boolean) {
				v = typeof v === 'boolean' ? v : !isActive.value;
				isActive.value = v;
			}
		});
		return () => {
			const contentClass = [{ 'is-confirm': props.mode }, props.contentClass, 'vc-modal__content'];
			return (
				<div class="vc-modal">
					<div
						v-show={props.mask && isMaskShown.value}
						ref={maskElement}
						class="vc-modal__mask"
						onClick={e => handleClose(e, props.maskClosable)}
					/>
					{/* 从最近一次点击的位置展开、缩回；wrapper 铺满视口且不缩放，是展开的窗口。按布局从刚离开按钮的姿态立即弹出，按钮上不留残影 */}
					<div
						ref={wrapper}
						style={props.wrapperStyle}
						class={[props.wrapperClass, 'vc-modal__wrapper']}
					>
						<TransitionReveal
							triggerElement={props.triggerElement}
							offset="auto"
							opacity
							companion={maskElement.value}
							// @ts-ignore 事件由 attrs 透传给内部 Transition
							onAfterLeave={handleRemove}
						>
							<div
								v-show={isActive.value}
								ref={container}
								class={[
									{
										'is-drag': props.draggable,
										'is-large': props.size === 'large' || props.size === 'medium',
										'is-auto-height': isAutoHeight.value,
										'has-footer': props.footer && (cancelText.value || okText.value),
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
									onMousedown={drag.listeners.onMousedown}
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
														<Customer
															// 标题行有最小高度：空字符串也保留它，头部高度不变
															wrap={props.title === ''}
															class="vc-modal__title"
															render={props.title}
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
								<div class="vc-modal__content-container">
									{
										props.scrollable
											? (
													<Scroller
														native={false}
														always={false}
														{...props.scrollerOptions}
														contentClass={contentClass}
														contentStyle={props.contentStyle}
													>
														{renderContent()}
													</Scroller>
												)
											: <div class={[contentClass, 'is-unscrollable']} style={props.contentStyle}>{renderContent()}</div>
									}
								</div>
								{
									(props.footer && (cancelText.value || okText.value)) && (
										<div class={[{ 'is-confirm': props.mode }, 'vc-modal__footer']}>
											{ slots['footer-extra']?.() }
											{
												!slots.footer
													? (
															<Fragment>
																{
																	cancelText.value && (
																		<Button
																			class="vc-modal__cancel-button"
																			disabled={props.cancelDisabled}
																			onClick={e => handleBefore(e, handleCancel)}
																		>
																			{ cancelText.value }
																		</Button>
																	)
																}
																{
																	okText.value && (
																		<Button
																			type="primary"
																			disabled={props.okDisabled}
																			onClick={e => handleBefore(e, handleOk)}
																		>
																			{ okText.value }
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
						</TransitionReveal>
					</div>
				</div>
			);
		};
	}
});
