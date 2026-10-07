/** @jsxImportSource vue */

import {
	ref,
	shallowRef,
	watch,
	computed,
	defineComponent,
	onMounted,
	onUnmounted,
	onUpdated,
	getCurrentInstance,
	Fragment
} from 'vue';
import { debounce } from 'lodash-es';
import { useScrollbar, useDrag } from '@deot/vc-hooks';
import type { DragPoint } from '@deot/vc-hooks';

import { Icon } from '../icon';
import { Button } from '../button';
import { TransitionScale, TransitionFade } from '../transition';
import { Customer } from '../customer';
import { Scroller } from '../scroller';
import { VcInstance } from '../vc';
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
		const header = shallowRef<HTMLElement>();

		const x = ref(props.x!);
		const y = ref(props.y!);
		const isActive = ref(false);
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
		// Portal调用时，可作为初始值
		let originX = VcInstance.globalEvent.x;
		let originY = VcInstance.globalEvent.y;

		/**
		 * 设置原始坐标
		 */
		const resetOrigin = debounce(function () {
			const el = container.value;

			if (!el) return;

			// wrapper 铺满视口，offsetLeft / offsetTop 即容器在视口中的位置
			el.style.transformOrigin = `${originX - el.offsetLeft}px ${originY - el.offsetTop}px 0`;
		}, 250, { leading: true });

		const handleEnter = () => {
			if (instance.isUnmounted) return;
			resetOrigin();
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
			if (!closable) return;
			// 用户主要取消与关闭事件关联
			if (props.closeWithCancel) {
				handleBefore(e, handleCancel);
			} else {
				isActive.value = false;
			}
		};
		const handleEscClose = (e: KeyboardEvent) => {
			if (e.code === 'Escape' && props.escClosable && isActive.value) {
				handleClose(e, true);
			}
		};

		const renderContent = () => {
			return (
				<Fragment>
					{
						typeof props.content === 'string'
							? (<div innerHTML={props.content} />)
							: typeof props.content === 'function'
								? (<Customer render={props.content} />)
								: null
					}
					{ slots.default?.() }
				</Fragment>
			);
		};

		const handleClick = (e: MouseEvent) => {
			// isActive click先触发,后设置后
			if (props.draggable && isActive.value && originX) return;
			originX = e.x;
			originY = e.y;
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

		// 标题栏拖动只用鼠标；位置随拖动即时生效，mouseup 丢失时与松开同样处理
		const drag = useDrag({
			start: (_, point) => handleMouseDown(point),
			move: (_, point) => handleMouseMove(point),
			// 放手后重新设置原点
			end: () => resetOrigin()
		});

		onMounted(() => {
			document.addEventListener('keydown', handleEscClose);
			document.addEventListener('click', handleClick, true);
		});

		onUpdated(() => {
			/**
			 * 非拖动状态下, 外部,会触发设置初始值
			 */
			!props.draggable && isActive.value && resetOrigin();
		});

		onUnmounted(() => {
			document.removeEventListener('click', handleClick, true);
			document.removeEventListener('keydown', handleEscClose);
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
			const contentClass = [{ 'is-confirm': props.mode }, props.contentClass, 'vc-modal__content'];
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
						style={props.wrapperStyle}
						class={[props.wrapperClass, 'vc-modal__wrapper']}
					>
						<TransitionScale
							mode="part"
							// @ts-ignore
							onEnter={handleEnter}
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
														{
															typeof props.title === 'string'
																? <div class="vc-modal__title" innerHTML={props.title} />
																: typeof props.title === 'function' && (
																	<Customer
																		render={props.title}
																	/>
																)
														}
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
						</TransitionScale>
					</div>
				</div>
			);
		};
	}
});
