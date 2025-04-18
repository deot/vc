/** @jsxImportSource vue */

import { getCurrentInstance, defineComponent, ref, onMounted, onUnmounted, watch } from 'vue';
import { props as noticeViewProps } from './notice-view-props';
import type { Props as NoticeProps } from './notice-view-props';

import { Icon } from '../icon';
import { TransitionSlide } from '../transition';
import { Customer } from '../customer';

const COMPONENT_NAME = 'vc-notice';

export const NoticeView = defineComponent({
	name: COMPONENT_NAME,
	props: noticeViewProps,
	emits: ['portal-fulfilled', 'close', 'before-close'],
	setup(props, { emit, expose }) {
		const instance = getCurrentInstance()!;
		const isActive = ref(false);
		const currentTitle = ref<NoticeProps['title']>();
		const currentContent = ref<NoticeProps['content']>();

		let timer: any;
		const setDuration = (v: number) => {
			timer && clearTimeout(timer);

			if (v === 0) return;
			timer = setTimeout(() => (isActive.value = false), v);
		};

		const setTitle = (v: NoticeProps['title']) => {
			currentTitle.value = v;
		};

		const setContent = (v: NoticeProps['content']) => {
			currentContent.value = v;
		};

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

		watch(() => props.title, setTitle, { immediate: true });
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
										currentTitle.value && (
											<div style={[{ marginBottom: currentContent.value ? '8px' : '' }]} class="vc-notice__title">
												{
													typeof currentTitle.value === 'string'
														? <div innerHTML={currentTitle.value} />
														: typeof currentTitle.value === 'function'
															? <Customer render={currentTitle.value} />
															: null
												}
											</div>
										)
									}
									{
										currentContent.value && (
											<div class="vc-notice__content">
												{
													typeof currentContent.value === 'string'
														? <div innerHTML={currentContent.value} />
														: typeof currentContent.value === 'function'
															? <Customer render={currentContent.value} />
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
