/** @jsxImportSource vue */

import { defineComponent, ref, computed, watch, getCurrentInstance, withDirectives, vShow, Fragment } from 'vue';
import { useScrollbar } from '@deot/vc-hooks';
import { Button } from '../button';
import { Icon } from '../icon';
import { Customer } from '../customer';
import { TransitionFade, TransitionSlide } from '../transition';
import { props as drawerProps } from './drawer-view-props';

const COMPONENT_NAME = 'vc-drawer';

export const DrawerView = defineComponent({
	name: COMPONENT_NAME,
	props: drawerProps,
	emits: ['close', 'update:modelValue', 'visible-change'],
	setup(props, { emit, slots, expose }) {
		const instance = getCurrentInstance()!;
		const isActive = ref(false);

		const classes = computed(() => {
			return {
				[`is-${props.placement}`]: true,
			};
		});
		const style = computed(() => {
			return props.placement === 'top' || props.placement === 'bottom'
				? { height: `${props.height}px` }
				: { width: `${props.width}px` };
		});

		watch(
			() => props.modelValue,
			(v) => {
				isActive.value = v;
			},
			{ immediate: true }
		);

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

		// 关闭事件
		const handleClose = (e: any, closable: boolean) => {
			if (closable
				|| (
					props.maskClosable
					&& e.target.classList.contains('vc-drawer__wrapper')
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

		/**
		 * 动画执行后关闭, 关闭事件都会被执行
		 * visible-change 由移除之后触发
		 * 同时close兼容portal设计
		 */
		const handleRemove = () => {
			!instance.isUnmounted && (
				emit('close'),
				emit('update:modelValue', false),
				emit('visible-change', false)
			);
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

		useScrollbar(isActive);

		expose({
			isActive, // for portal
			toggle(v?: boolean) {
				v = typeof v === 'boolean' ? v : !isActive.value;
				isActive.value = v;
			}
		});
		return () => {
			return (
				<div class={[classes.value, 'vc-drawer']}>
					<TransitionFade delay={50}>
						{
							withDirectives(
								<div
									style={props.maskStyle}
									class="vc-drawer__mask"
									onClick={e => handleClose(e, props.maskClosable)}
								/>,
								[[vShow, props.mask && isActive.value]]
							)
						}
					</TransitionFade>

					<TransitionSlide
						mode={props.placement}
						// @ts-ignore
						onAfterLeave={handleRemove}
					>
						{
							withDirectives(
								<div
									class={[props.wrapperClass, 'vc-drawer__wrapper']}
									style={[style.value, props.wrapperStyle]}
								>
									<div class="vc-drawer__container">
										<div class="vc-drawer__header">
											{
												slots.header
													? slots.header()
													: (
															typeof props.title === 'string'
																? <div class="vc-drawer__title" innerHTML={props.title} />
																: typeof props.title === 'function' && (
																	<Customer
																		render={props.title}
																	/>
																)
														)
											}
											<a class="vc-drawer__close" onClick={e => handleClose(e, true)}>
												<Icon type="close" />
											</a>
										</div>
										<div
											class={['vc-drawer__content']}
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
												<div class={['vc-drawer__footer']}>
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
								</div>,
								[[vShow, isActive.value]]
							)
						}
					</TransitionSlide>
				</div>
			);
		};
	}
});
