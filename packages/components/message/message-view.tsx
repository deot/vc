/** @jsxImportSource vue */

import { getCurrentInstance, defineComponent, ref, shallowRef, nextTick, onMounted, onUnmounted, watch } from 'vue';
import { Resize } from '@deot/helper-resize';
import { props as messageProps } from './message-view-props';
import type { Props as MessageProps } from './message-view-props';
import { Icon } from '../icon';
import { Spin } from '../spin';
import { TransitionSlide } from '../transition';
import { Customer } from '../customer/index';
import * as Stack from './stack';
import type { StackItem } from './stack';
import { Utils } from '@deot/vc-shared';

const COMPONENT_NAME = 'vc-message';

export const MessageView = defineComponent({
	name: COMPONENT_NAME,
	emits: ['before-close', 'close', 'portal-fulfilled'],
	props: messageProps,
	setup(props, { emit, expose }) {
		const instance = getCurrentInstance()!;
		const isActive = ref(false);
		const currentContent = ref<MessageProps['content']>();
		const currentMode = ref<MessageProps['mode']>(props.mode);
		const container = ref<HTMLElement>();

		let timer: any;
		let duration = 0;
		const startTimer = () => {
			timer && clearTimeout(timer);
			if (duration === 0) return;
			timer = setTimeout(() => (isActive.value = false), duration);
		};

		const setDuration = (v: number) => {
			duration = v;
			startTimer();
		};

		// 鼠标悬停时暂停自动关闭，移出后重新计时
		const handleMouseenter = () => {
			timer && clearTimeout(timer);
			timer = null;
		};

		const handleMouseleave = () => {
			isActive.value && startTimer();
		};

		const setMode = (v: MessageProps['mode']) => {
			currentMode.value = v;
		};

		// 固定定位时加入同一 top 的堆叠，前面的提示关闭后上移补位
		const stack = shallowRef<StackItem>();
		const refreshHeight = () => {
			if (stack.value && container.value) {
				stack.value.height = container.value.offsetHeight;
			}
		};
		const leaveStack = () => {
			if (!stack.value) return;
			Stack.remove(stack.value);
			container.value && Resize.off(container.value, refreshHeight);
			stack.value = undefined;
		};

		const setContent = (v: MessageProps['content']) => {
			currentContent.value = v;
		};

		// 兼容Portal设计
		const handleRemove = () => {
			leaveStack();
			emit('close');
			emit('portal-fulfilled');
		};

		const handleClose = async (e: any, closable: boolean) => {
			if (!isActive.value || closable === false) return;

			const cancel = instance.vnode.props?.onBeforeClose || props.onBeforeClose || (() => {});

			return Utils.runGuard(cancel(e), () => (isActive.value = false));
		};

		watch(() => props.content, setContent, { immediate: true });
		watch(() => props.mode, setMode);
		watch(() => props.top, (v) => {
			stack.value && (stack.value.top = v);
		});

		onMounted(() => {
			isActive.value = true;
			setDuration(props.duration);
			if (!props.fixed) return;
			stack.value = Stack.add(props.top);
			// 显示后再量高度；之后内容变化由 Resize 更新
			nextTick(() => {
				if (!stack.value) return;
				refreshHeight();
				Resize.on(container.value!, refreshHeight);
			});
		});

		onUnmounted(() => {
			timer && clearTimeout(timer);
			leaveStack();
		});

		const exposes = ['destroy', 'remove', 'close', 'hide']
			.reduce((pre, key) => {
				pre[key] = handleRemove;
				return pre;
			}, {
				setContent,
				setDuration,
				setMode
			});

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
						mode="bottom"
						// @ts-ignore
						onAfterLeave={handleRemove}
					>
						<div
							v-show={isActive.value}
							class={['vc-message__wrapper', { 'is-fixed': props.fixed }]}
							style={props.fixed ? { top: `${stack.value ? Stack.getOffset(stack.value) : props.top}px` } : {}}
						>
							<div
								ref={container}
								class="vc-message__container"
								role={currentMode.value === 'error' ? 'alert' : 'status'}
								aria-live={currentMode.value === 'error' ? 'assertive' : 'polite'}
								onMouseenter={handleMouseenter}
								onMouseleave={handleMouseleave}
							>
								{
									currentMode.value === 'loading'
										? (
												<Spin
													size={14}
													class="vc-message__loading"
												/>
											)
										: (
												<Icon
													type={currentMode.value}
													class={[`is-${currentMode.value}`, 'vc-message__icon']}
												/>
											)
								}

								<Customer class="vc-message__content" render={currentContent.value} />

								{
									props.closable && (
										<Icon
											type="close"
											class="vc-message__close"
											// @ts-ignore
											onClick={(e: any) => handleClose(e, true)}
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
