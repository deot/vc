/** @jsxImportSource vue */

import { defineComponent, ref, onMounted, onUnmounted, withDirectives, vShow } from 'vue';
import { props as messageProps } from './message-view-props';
import { Icon } from "../icon";
import { Spin } from "../spin";
import { TransitionSlide } from '../transition';
import { Customer } from "../customer/index";

const COMPONENT_NAME = 'vc-message';

export const MessageView = defineComponent({
	name: COMPONENT_NAME,
	emits: ['close', 'portal-fulfilled'],
	props: messageProps,
	setup(props, { emit, expose }) {
		const isVisible = ref(false);

		// 兼容Portal设计
		const handleRemove = () => {
			emit('close');
			emit('portal-fulfilled');
		};

		const handleClose = () => {
			if (props.maskClosable) {
				isVisible.value = false;
			}
		};

		let timer: any;
		onMounted(() => {
			isVisible.value = true;
			if (props.duration !== 0) {
				timer = setTimeout(() => {
					// 主线程
					isVisible.value = false;
				}, props.duration * 1000 - 300); // 动画时间
			}
		});

		onUnmounted(() => {
			timer && clearTimeout(timer);
		});

		let exposes = ['destroy', 'remove', 'close', 'hide']
			.reduce((pre, key) => {
				pre[key] = handleRemove;
				return pre;
			}, {});

		expose(exposes);

		return () => {
			return (
				<div class="vc-message">
					{
						props.mask && (
							<div 
								class="vc-message__mask"
								onClick={handleClose} 
							/>
						)
					}
					<TransitionSlide 
						mode="up" 
						// @ts-ignore
						onAfterLeave={handleRemove}
					>
						{
							withDirectives(
								(
									<div 
										style={{ top: `${props.top}px` }}
										class="vc-message__wrapper"
									>
										<div class="vc-message__container">
											{
												props.mode === 'loading' 
													? (
														<Spin 
															size={14}
															class="vc-message__loading" 
														/>
													)
													: (
														<Icon 
															type={props.mode} 
															class={[`is-${props.mode}`, 'vc-message__icon']}
														/>
													)
											}

											{
												typeof props.content === 'string' 
													? (
														<div 
															class="vc-message__content"
															innerHTML={props.content}
														/>
													)
													: typeof props.content === 'function'
														? (<Customer render={props.content} />)
														: null
											}

											{
												props.closable && (
													<Icon 
														type="close"
														class="vc-message__close"
														// @ts-ignore
														onClick={handleClose} 
													/>
												)
											}
										</div>
									</div>
								),
								[[vShow, isVisible.value]]
							)
						}
					</TransitionSlide>
				</div>
			);
		};
	}
});