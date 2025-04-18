/** @jsxImportSource vue */

import { defineComponent, ref, onMounted, onUnmounted, withModifiers, watch } from 'vue';
import { props as toastProps } from './toast-view-props';
import type { Props as ToastProps } from './toast-view-props';

import { MCustomer } from '../../customer/index.m';
import { MSpin } from '../../spin/index.m';
import { MTransitionFade } from '../../transition/index.m';

const COMPONENT_NAME = 'vcm-toast';

export const MToastView = defineComponent({
	name: COMPONENT_NAME,
	emits: ['close', 'portal-fulfilled'],
	props: toastProps,
	setup(props, { emit, expose }) {
		const isActive = ref(false);
		const currentContent = ref<ToastProps['content']>();

		let timer: any;
		const setDuration = (v: number) => {
			timer && clearTimeout(timer);

			if (v === 0) return;
			timer = setTimeout(() => (isActive.value = false), v);
		};

		const setContent = (v: ToastProps['content']) => {
			currentContent.value = v;
		};

		// 兼容Portal设计
		const handleRemove = () => {
			emit('close');
			emit('portal-fulfilled');
		};

		const handleClose = () => {
			if (props.maskClosable) {
				isActive.value = false;
			}
		};

		watch(() => props.content, setContent, { immediate: true });

		onMounted(() => {
			isActive.value = true;
			setDuration(props.duration);
		});

		onUnmounted(() => {
			timer && clearTimeout(timer);
		});

		const exposes = ['destroy', 'remove', 'close', 'hide']
			.reduce((pre, key) => {
				pre[key] = handleRemove;
				return pre;
			}, {
				setContent,
				setDuration
			});

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
						<div v-show={isActive.value} class="vcm-toast__wrapper">
							{ props.mode === 'loading' && (<MSpin class="vcm-toast__loading" />) }
							{
								typeof currentContent.value === 'string'
									? (<div class="vcm-toast__content" innerHTML={currentContent.value} />)
									: typeof currentContent.value === 'function'
										? (<MCustomer render={currentContent.value} />)
										: null
							}
						</div>
					</MTransitionFade>
				</div>
			);
		};
	}
});
