/** @jsxImportSource vue */

import { defineComponent, ref, onMounted, onUnmounted, withModifiers, withDirectives, vShow } from 'vue';
import { props as toastProps } from './toast-view-props';

import { MCustomer } from "../../customer/index.m";
import { MSpin } from "../../spin/index.m";
import { MTransitionFade } from "../../transition/index.m";

const COMPONENT_NAME = 'vcm-toast';

export const MToastView = defineComponent({
	name: COMPONENT_NAME,
	props: toastProps,
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
				}, props.duration - 300); // 动画时间
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
				<div class="vcm-toast">
					<div 
						class="vcm-toast__bg" 
						onClick={handleClose}
						onTouchmove={withModifiers(() => {}, ['prevent'])}
					/>
					<MTransitionFade 
						duration={{ enter: 300, leave: 150 }}
						// @ts-ignore
						onAfterLeave={handleRemove}
					>
						{
							withDirectives(
								(
									<div class="vcm-toast__wrapper">
										{ props.mode === 'loading' && (<MSpin class="vcm-toast__loading" />) }
										{ 
											typeof props.content === 'string'
												? (<div class="vcm-toast__content" innerHTML={props.content} />) 
												: typeof props.content === 'function' 
													? (<MCustomer render={props.content} />)
													: null
										}
									</div>
								),
								[[vShow, isVisible.value]]
							)
						}
						
					</MTransitionFade>
				</div>
			);
		};
	}
});
