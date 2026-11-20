/** @jsxImportSource vue */

import { getCurrentInstance, defineComponent, ref, onMounted, onUnmounted, watch } from 'vue';
import { props as noticeViewProps } from './notice-view-props';
import type { Props as NoticeProps } from './notice-view-props';

import { Icon } from '../icon';
import { Spin } from '../spin';
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
		const currentMode = ref<NoticeProps['mode']>(props.mode);

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

		const setMode = (v: NoticeProps['mode']) => {
			currentMode.value = v;
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
		watch(() => props.mode, setMode);

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
				setTitle,
				setContent,
				setDuration,
				setMode
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
							<div
								class={['vc-notice__container', { 'is-closable': props.closable }]}
								role={currentMode.value === 'error' ? 'alert' : 'status'}
								aria-live={currentMode.value === 'error' ? 'assertive' : 'polite'}
								onMouseenter={handleMouseenter}
								onMouseleave={handleMouseleave}
							>
								{
									currentMode.value === 'loading'
										? (<Spin size={22} class="vc-notice__loading" />)
										: currentMode.value && (
											<Icon
												type={`o-${currentMode.value}`}
												class={[`is-${currentMode.value}`, 'vc-notice__icon']}
											/>
										)
								}

								<div class="vc-notice__body">
									{
										currentTitle.value && (
											<div class={['vc-notice__title', { 'has-content': !!currentContent.value }]}>
												<Customer render={currentTitle.value} />
											</div>
										)
									}
									{
										currentContent.value && (
											<div class="vc-notice__content">
												<Customer render={currentContent.value} />
											</div>
										)
									}
								</div>
								{
									props.closable && (
										<Icon
											type="close"
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
