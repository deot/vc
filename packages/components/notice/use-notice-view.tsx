/** @jsxImportSource vue */

import { getCurrentInstance, ref, onMounted, onUnmounted, watch } from 'vue';
import type { SetupContext } from 'vue';
import { useDrag } from '@deot/vc-hooks';
import { toRem, Utils } from '@deot/vc-shared';
import type { Props } from './notice-view-props';

import { Icon } from '../icon';
import { Spin } from '../spin';
import { TransitionSlide } from '../transition';
import { Customer } from '../customer';

// 上滑关闭：上移超过自身高度的比例，或松手前的速度（px/ms）
const SWIPE_RATIO = 0.3;
const SWIPE_VELOCITY = 0.5;

/**
 * Notice 与 MNotice 共用
 * @param props ~
 * @param context ~
 * @param context.emit ~
 * @param context.expose ~
 * @param options ~
 * @param options.mobile 移动端（MNotice）：根节点加标记类 vcm-notice，顶部通栏、从上方滑入，可上滑关闭；top 为 750 稿长度
 * @returns render
 */
export const useNoticeView = (
	props: Props,
	{ emit, expose }: SetupContext<['portal-fulfilled', 'close', 'before-close']>,
	options: { mobile?: boolean } = {}
) => {
	const { mobile = false } = options;
	const name = mobile ? 'vc-notice vcm-notice' : 'vc-notice';
	const toLength = mobile ? toRem : (v: number) => `${v}px`;
	const spinSize = mobile ? toRem(28) : 22;

	const instance = getCurrentInstance()!;
	const isActive = ref(false);
	const currentTitle = ref<Props['title']>();
	const currentContent = ref<Props['content']>();
	const currentMode = ref<Props['mode']>(props.mode);

	let timer: any;
	let duration = 0;
	const clearTimer = () => {
		timer && clearTimeout(timer);
		timer = null;
	};

	const startTimer = () => {
		clearTimer();
		if (duration === 0) return;
		timer = setTimeout(() => (isActive.value = false), duration);
	};

	const setDuration = (v: number) => {
		duration = v;
		startTimer();
	};

	// 鼠标悬停时暂停自动关闭，移出后重新计时
	const handleMouseenter = clearTimer;

	const handleMouseleave = () => {
		isActive.value && startTimer();
	};

	const setMode = (v: Props['mode']) => {
		currentMode.value = v;
	};

	const setTitle = (v: Props['title']) => {
		currentTitle.value = v;
	};

	const setContent = (v: Props['content']) => {
		currentContent.value = v;
	};

	// 兼容Portal设计
	const handleRemove = () => {
		emit('close');
		emit('portal-fulfilled');
	};

	// 返回是否关闭（onBeforeClose 阻止时为 false）
	const handleClose = async (e: any) => {
		if (!isActive.value) return false;

		const cancel = instance.vnode.props?.onBeforeClose || props.onBeforeClose || (() => {});

		// 拒绝时保持显示（上滑关闭时回弹）
		return Utils.runGuard(cancel(e), () => (isActive.value = false));
	};

	// 上滑关闭（移动端）：按住暂停计时，只跟随向上的位移；松手超过阈值则关闭，否则回弹并重新计时
	const offset = ref(0);
	const dragging = ref(false);
	const container = ref<HTMLElement>();
	let startY = 0;
	let lastY = 0;
	let lastTime = 0;
	let velocity = 0;
	const drag = mobile
		? useDrag({
				start: (_, point) => {
					if (!isActive.value) return false;
					startY = lastY = point.clientY;
					lastTime = Date.now();
					velocity = 0;
					dragging.value = true;
					clearTimer();
				},
				move: (e, point) => {
					const now = Date.now();
					velocity = (point.clientY - lastY) / Math.max(now - lastTime, 1);
					lastY = point.clientY;
					lastTime = now;
					offset.value = Math.min(0, point.clientY - startY);
					e.cancelable && e.preventDefault();
				},
				end: async (e) => {
					dragging.value = false;
					const height = container.value?.offsetHeight || 0;
					const swiped = offset.value < 0 && (-offset.value > height * SWIPE_RATIO || velocity < -SWIPE_VELOCITY);
					if (!swiped || !(await handleClose(e))) {
						offset.value = 0;
						isActive.value && startTimer();
					}
				},
				cancel: () => {
					dragging.value = false;
					offset.value = 0;
					isActive.value && startTimer();
				}
			})
		: null;

	watch(() => props.title, setTitle, { immediate: true });
	watch(() => props.content, setContent, { immediate: true });
	watch(() => props.mode, setMode);

	onMounted(() => {
		isActive.value = true;
		setDuration(props.duration);
	});

	onUnmounted(clearTimer);

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
		const mode = currentMode.value;
		const containerStyle = mobile && (offset.value || dragging.value)
			? { transform: `translateY(${offset.value}px)`, transition: dragging.value ? 'none' : undefined }
			: undefined;
		return (
			<div
				class={[name, { 'is-fixed': props.fixed, 'is-offset': mobile && props.fixed && !!props.top }]}
				style={props.fixed ? { top: toLength(props.top) } : {}}
			>
				<TransitionSlide
					mode={mobile ? 'top' : 'right'}
					// @ts-ignore
					onAfterLeave={handleRemove}
				>
					<div v-show={isActive.value} class="vc-notice__wrapper">
						<div
							ref={container}
							class={[
								'vc-notice__container',
								mode && `is-${mode}`,
								{ 'is-closable': props.closable, 'has-content': !!(currentTitle.value && currentContent.value) }
							]}
							style={containerStyle}
							role={mode === 'error' ? 'alert' : 'status'}
							aria-live={mode === 'error' ? 'assertive' : 'polite'}
							onMouseenter={handleMouseenter}
							onMouseleave={handleMouseleave}
							{...drag?.listeners}
						>
							{
								mode === 'loading'
									? (<Spin size={spinSize} class="vc-notice__loading" />)
									: mode && (
										<Icon
											type={`o-${mode}`}
											class={[`is-${mode}`, 'vc-notice__icon']}
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
};
