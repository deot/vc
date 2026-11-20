/** @jsxImportSource vue */

import { defineComponent, ref, onMounted, onUnmounted, withModifiers, watch } from 'vue';
import { toRem } from '@deot/vc-shared';
import { props as toastProps } from './toast-view-props';
import type { Props as ToastProps } from './toast-view-props';

import { MCustomer } from '../../customer/index.m';
import { MIcon } from '../../icon/index.m';
import { MSpin } from '../../spin/index.m';
import { MTransitionFade } from '../../transition/index.m';

const COMPONENT_NAME = 'vcm-toast';

// 带状态图标的模式（info 不显示图标）
const ICON_MODES = ['success', 'warning', 'error'];
// 加载图标与状态图标同尺寸，跟随局部变量 --vc-toast-icon-size（750 稿 48）
const SPIN_SIZE = `var(--vc-toast-icon-size, ${toRem(48)})`;

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
			if (props.mask && props.maskClosable) {
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
			const isLoading = props.mode === 'loading';
			const hasIcon = ICON_MODES.includes(props.mode);
			const isAlert = props.mode === 'error';
			return (
				<div class="vcm-toast">
					{
						props.mask && (
							<div
								class="vcm-toast__bg"
								onClick={handleClose}
								onTouchmove={withModifiers(() => {}, ['prevent'])}
							/>
						)
					}
					<MTransitionFade
						duration={{ enter: 300, leave: 150 }}
						// @ts-ignore
						onAfterLeave={handleRemove}
					>
						<div
							v-show={isActive.value}
							class={['vcm-toast__wrapper', `is-${props.placement}`, { 'is-vertical': isLoading || hasIcon }]}
							role={isAlert ? 'alert' : 'status'}
							aria-live={isAlert ? 'assertive' : 'polite'}
						>
							{ isLoading && (<MSpin class="vcm-toast__loading" size={SPIN_SIZE} />) }
							{ hasIcon && (<MIcon class="vcm-toast__icon" type={props.mode} />) }
							<MCustomer class="vcm-toast__content" render={currentContent.value} />
						</div>
					</MTransitionFade>
				</div>
			);
		};
	}
});
