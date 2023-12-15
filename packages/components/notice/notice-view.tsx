/** @jsxImportSource vue */

import { getCurrentInstance, defineComponent, ref, onMounted, onUnmounted } from 'vue';
import { props as noticeViewProps } from './notice-view-props';

import { Icon } from '../icon';
import { TransitionSlide } from '../transition';
import { Customer } from '../customer';

const COMPONENT_NAME = 'vc-notice';

export const NoticeView = defineComponent({
	name: COMPONENT_NAME,
	props: noticeViewProps,
	emits: ['portal-fulfilled', 'close', 'before-close'],
	setup(props, { emit }) {
		const instance = getCurrentInstance()!;
		const isActive = ref(false);

		let timer: any;
		onMounted(() => {
			isActive.value = true;
			if (props.duration !== 0) {
				timer = setTimeout(() => {
					// 主线程
					isActive.value = false;
				}, props.duration * 1000 - 300); // 动画时间
			}
		});

		onUnmounted(() => {
			timer && clearTimeout(timer);
		});

		// 兼容Portal设计
		const handleRemove = () => {
			emit('close');
			emit('portal-fulfilled');
		};

		const handleClose = async (e: any) => {
			if (!isActive.value) return;

			const cancel = instance.vnode.props?.onBeforeClose || props.onBeforeClose || (() => {});

			const fn = cancel && cancel(e);
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

		return () => {
			return (
				<div
					class={['vc-notice', { 'is-fixed': props.fixed }]}
					style={props.fixed ? { top: `${props.top}px` } : {}}
				>
					<TransitionSlide
						mode="right"
						// @ts-ignore
						onAfterLeave={handleRemove}
					>
						<div v-show={isActive.value} class="vc-notice__wrapper">
							<div class="vc-notice__container">
								{ props.mode && (<Icon type={`o-${props.mode}`} class={[`is-${props.mode}`, 'vc-notice__icon']} />) }

								<div>
									{
										props.title && (
											<div style={[{ marginBottom: props.content ? '8px' : '' }]} class="vc-notice__title">
												{
													typeof props.title === 'string'
														? <div innerHTML={props.title} />
														: typeof props.title === 'function'
															? <Customer render={props.title} />
															: null
												}
											</div>
										)
									}
									{
										props.content && (
											<div class="vc-notice__content">
												{
													typeof props.content === 'string'
														? <div innerHTML={props.content} />
														: typeof props.content === 'function'
															? <Customer render={props.content} />
															: null
												}
											</div>
										)
									}
								</div>
								{
									props.closable && (
										<Icon
											type="close"
											style="font-size: 12px"
											class="vc-notice__close"
											// @ts-ignore
											onClick={handleClose}
										/>
									)
								}
							</div>
						</div>
					</TransitionSlide>
				</div>
			);
		};
	}
});
