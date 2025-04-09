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
		const content = shallowRef<HTMLElement>();

		const x = ref(0);
		const y = ref(0);
		const isActive = ref(false);

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
				height
			};
		});

		const basicStyle = computed(() => {
			return {
				width: `${defaultSize.value.width}px`,
				minHeight: `${defaultSize.value.height}px`,

				// 注: 服务端渲染为0, 在客服端激活前，展示端存在问题【高度不定】
				maxHeight: IS_SERVER ? 0 : `${window.innerHeight - 20}px`,
			};
		});

		const draggableStyle = computed(() => {
			if (IS_SERVER || !props.draggable) return {};

			const left = x.value || window.innerWidth / 2 - defaultSize.value.width / 2;
			const top = y.value || window.innerHeight / 2 - defaultSize.value.height / 2;

			return {
				left: `${left}px`,
				top: `${top}px`,
			};
		});

		useScrollbar(isActive);
		watch(
			() => props.modelValue,
			(v) => {
				isActive.value = v;
			},
			{ immediate: true }
		);

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

		const handleEnter = () => resetOrigin();
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
		 * 解决handleContainerResize设置高度后
		 * content变化，高度无法重写计算的问题，因为content有over-flow-y: auto;
		 *
		 * 移除后可能会再次触发handleContainerResize
		 */
		const handleContentResize = () => {
			const has = !!container.value!.style.getPropertyValue('height');
			has && container.value!.style.removeProperty('height');
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
			Resize.on(content.value!, handleContentResize);
		});

		onUpdated(() => {
			/**
			 * 非拖动状态下, 外部,会触发设置初始值
			 */
			!props.draggable && isActive.value && resetOrigin();
		});

		onBeforeUnmount(() => {
			Resize.off(container.value!, handleContainerResize);
			Resize.off(content.value!, handleContentResize);
		});

		onUnmounted(() => {
			document.removeEventListener('click', handleClick, true);
			document.removeEventListener('keydown', handleEscClose);
			document.removeEventListener('mousemove', handleMouseMove);
			document.removeEventListener('mouseup', handleMouseUp);
		});

		expose({
			isActive, // for portal
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
						style={[props.styles || {}, props.draggable ? { top: 0 } : {}]}
						class="vc-modal__wrapper"
						// @ts-ignore
						onClick={e => handleClose(e, false)}
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
										'is-no-footer': !props.footer || (!props.cancelText && !props.okText)
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
														<div class="vc-modal__title" innerHTML={props.title} />
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
								<div
									ref={content}
									class={[{ 'is-confirm': props.mode }, props.portalClass, 'vc-modal__content']}
								>
									{
										typeof props.content === 'string'
											? (<div innerHTML={props.content} />)
											: typeof props.content === 'function'
												? (<Customer render={props.content} />)
												: null
									}
									{ slots.default?.() }
								</div>
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
