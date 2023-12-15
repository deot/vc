/** @jsxImportSource vue */

import { getCurrentInstance, defineComponent, ref, onMounted, onUnmounted } from 'vue';
import { props as messageProps } from './message-view-props';
import { Icon } from '../icon';
import { Spin } from '../spin';
import { TransitionSlide } from '../transition';
import { Customer } from '../customer/index';

const COMPONENT_NAME = 'vc-message';

export const MessageView = defineComponent({
	name: COMPONENT_NAME,
	emits: ['before-close', 'close', 'portal-fulfilled'],
	props: messageProps,
	setup(props, { emit, expose }) {
		const instance = getCurrentInstance()!;
		const isActive = ref(false);

		// 兼容Portal设计
		const handleRemove = () => {
			emit('close');
			emit('portal-fulfilled');
		};

		const handleClose = async (e: any, closable: boolean) => {
			if (!isActive.value || closable === false) return;

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

		const exposes = ['destroy', 'remove', 'close', 'hide']
			.reduce((pre, key) => {
				pre[key] = handleRemove;
				return pre;
			}, {});

		expose(exposes);

		return () => {
			return (
				<div class="vc-message">
					{
						(props.mask && props.fixed) && (
							<div
								class="vc-message__mask"
								onClick={e => handleClose(e, props.maskClosable)}
							/>
						)
					}
					<TransitionSlide
						mode="up"
						// @ts-ignore
						onAfterLeave={handleRemove}
					>
						<div
							v-show={isActive.value}
							class={['vc-message__wrapper', { 'is-fixed': props.fixed }]}
							style={props.fixed ? { top: `${props.top}px` } : {}}
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
											onClick={e => handleClose(e, true)}
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
