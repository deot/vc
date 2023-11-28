/** @jsxImportSource vue */

import {
	ref,
	watch,
	computed,
	defineComponent,
	getCurrentInstance,
	Fragment
} from 'vue';
import { useScrollbar } from '@deot/vc-hooks';

import { MTransitionZoom, MTransitionFade } from '../../transition/index.m';
import { MCustomer } from "../../customer/index.m";

import { props as modalProps } from './modal-view-props';

const COMPONENT_NAME = 'vc-modal';

export const MModalView = defineComponent({
	name: COMPONENT_NAME,
	emits: ['update:modelValue', 'portal-fulfilled', 'close', 'ok', 'cancel'],
	props: modalProps,
	setup(props, { slots, emit, expose }) {
		const instance = getCurrentInstance()!;

		const isActive = ref(false);

		const handleBefore = (e: any, hook: any) => {
			if (!isActive.value) return;

			// 2.x使用的是callback
			let fn = hook && hook(e);
			if (fn && fn.then) {
				return fn
					.then((res: any) => {
						isActive.value = false;
						return res;
					});
			} else if (!fn) {
				isActive.value = false;
			}
		};

		// 用户点击确定的回调 兼容portal设计
		const handleOk = (...rest: any[]) => {
			let ok = instance.vnode.props?.onOk || props.onOk || (() => {});

			return ok(...rest);
		};

		// 用户点击取消按钮时为取消 兼容portal设计
		const handleCancel = (...rest: any[]) => {
			let cancel = instance.vnode.props?.onCancel || props.onCancel || (() => {});

			return cancel(...rest);
		};

		// 关闭事件
		const handleClose = (e: any, closable: boolean) => {
			if (closable 
				|| (
					props.maskClosable 
					&& e.target.classList.contains('vcm-modal__wrapper')
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
		 * 同时portal-fulfilled兼容portal设计
		 */
		const handleRemove = () => {
			!instance.isUnmounted && (
				emit('close'),
				emit('portal-fulfilled'),
				emit('update:modelValue', false)
			);
		};

		const curentActions = computed(() => {
			return props.actions || [
				{
					text: props.cancelText,
					onPress: handleCancel
				},
				{
					text: props.okText,
					onPress: handleOk
				}
			];
		});

		const basicStyle = computed(() => {
			return {
				width: `${props.width}px`,
				maxHeight: `${window.innerHeight - 20}px`,
			};
		});

		const footerClasses = computed(() => {
			let len = curentActions.value.filter((i: any) => i.text).length;
			return { 
				'is-column': len >= 3,	
				'is-alone': len === 1,
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

		expose({
			isActive // for portal
		});
		return () => {
			return (
				<div class="vcm-modal">
					<MTransitionFade duration={200}>
						<div
							v-show={props.mask && isActive.value}
							class="vcm-modal__mask"
							// @ts-ignore
							onClick={(e) => handleClose(e, props.maskClosable)}
						/>
					</MTransitionFade>
					<div
						style={[props.styles || {}]}
						class="vcm-modal__wrapper"
					>
						<MTransitionZoom
							mode="center"
							duration={200}
							// @ts-ignore
							onAfterLeave={handleRemove}
						>
							<div
								v-show={isActive.value}
								style={[basicStyle.value]} 
								class="vcm-modal__container"
							>
								{
									props.mode === 'alert'
										? (
											<Fragment>
												{
													(props.title || slots.header) && (
														<div class="vcm-modal__header">
															{
																slots.header?.() || (
																	<div class="vcm-modal__title" innerHTML={props.title as string} />
																)
															}
														</div>
													)
												}

												{
													(props.content || slots.default) && (
														<div 
															class={[{ 'vcm-modal__no-title': !props.title }, 'vcm-modal__content']}
														>
															{
																(typeof props.content === 'string' || slots.default) 
																	? (
																		<div 
																			class="vcm-modal__html" 
																		>	
																			{ 
																				typeof props.content === 'string' 
																					&& (<div innerHTML={props.content} />) 
																			}
																			{ slots.default?.() }
																		</div>
																	)
																	: typeof props.content === 'function'
																		? <MCustomer render={props.content}/>
																		: null
															}
														</div>
													)
												}
												{
													(props.footer || slots.footer) && (
														<div class={[footerClasses.value, 'vcm-modal__footer']}>
															{
																slots.footer?.() || (
																	curentActions.value.map((item: any, index) => {
																		if (!item.text) return null;
																		return (
																			<div
																				key={index}
																				style={[item.style]}
																				class="vcm-modal__button"
																				onClick={e => handleBefore(e, item.onPress)}
																				innerHTML={item.text}
																			/>
																		);
																	})
																)
															}
														</div>
													)
												}
											</Fragment>
										) : props.mode === 'operation'
											? (
												<div class="vcm-modal__operation">
													{
														curentActions.value.map((item: any, index) => {
															if (!item.text) return null;
															return (
																<div 
																	key={index}
																	style={[item.style]}
																	class="vcm-modal__button"
																	innerHTML={item.text}
																	onClick={(e) => handleBefore(e, item.onPress)}
																/>	
															);
														})
													}
												</div>
											)
											: null
								}
							</div>
						</MTransitionZoom>
					</div>
				</div>
			);
		};
	}
});
