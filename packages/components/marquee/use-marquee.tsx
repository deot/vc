/** @jsxImportSource vue */

import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import type { SetupContext } from 'vue';
import { Resize } from '@deot/helper-resize';
import type { Props } from './marquee-props';
import { Customer } from '../customer';

const SHARED = { shared: true };

/**
 * Marquee 与 MMarquee 共用：内容复制一份首尾相接，轨道平移 -50% 一轮，无缝循环；
 * 一轮的距离 = 单份内容（含间距）的尺寸，时长 = 距离 / speed，均写入 CSS 变量，keyframes 全局共用一份
 * @param props ~
 * @param context ~
 * @param context.slots ~
 * @param context.emit ~
 * @param options ~
 * @param options.mobile 移动端（MMarquee）：根节点加标记类 vcm-marquee，间距由 mobile/style.scss 覆盖局部变量
 * @returns render
 */
export const useMarquee = (props: Props, { slots, emit }: SetupContext<['loop']>, options: { mobile?: boolean } = {}) => {
	const name = options.mobile ? 'vc-marquee vcm-marquee' : 'vc-marquee';
	const wrapper = ref<HTMLElement>();
	const content = ref<HTMLElement>();

	const distance = ref(0); // 单份内容（含间距）沿滚动方向的尺寸
	const overflow = ref(false);

	const vertical = computed(() => props.direction === 'up' || props.direction === 'down');
	const running = computed(() => props.animated && distance.value > 0 && (props.always || overflow.value));

	const refresh = () => {
		if (!wrapper.value || !content.value) return;
		const isVertical = vertical.value;
		const box = isVertical ? wrapper.value.clientHeight : wrapper.value.clientWidth;
		const size = isVertical ? content.value.offsetHeight : content.value.offsetWidth;
		// 间距放在内容尾部，判断溢出时去掉
		const style = getComputedStyle(content.value);
		const gap = parseFloat(isVertical ? style.paddingBottom : style.paddingRight) || 0;
		distance.value = size;
		overflow.value = size - gap > box;
	};

	onMounted(() => {
		refresh();
		[wrapper.value, content.value].forEach(el => el && Resize.on(el, refresh, SHARED));
	});

	onBeforeUnmount(() => {
		[wrapper.value, content.value].forEach(el => el && Resize.off(el, refresh, SHARED));
	});

	const handleIteration = (e: AnimationEvent) => {
		e.target === e.currentTarget && emit('loop');
	};

	const renderContent = () => (<Customer render={slots.default || props.content} />);

	return () => {
		const isRunning = running.value;
		const style: Record<string, string> = {};
		if (isRunning) {
			style['--vc-marquee-duration'] = `${distance.value / props.speed}s`;
			props.delay && (style['--vc-marquee-delay'] = `${props.delay}ms`);
		}
		typeof props.gap === 'number' && (style['--vc-marquee-gap'] = `${props.gap}px`);

		return (
			<div
				ref={wrapper}
				role="marquee"
				aria-live="off"
				class={[
					name,
					`is-${props.direction}`,
					vertical.value ? 'is-vertical' : 'is-horizontal',
					{ 'is-running': isRunning, 'is-pause-on-hover': isRunning && props.pauseOnHover }
				]}
				style={style}
			>
				<div class="vc-marquee__track" onAnimationiteration={handleIteration}>
					<div ref={content} class="vc-marquee__content">
						{renderContent()}
					</div>
					{
						isRunning && (
							<div class="vc-marquee__content" aria-hidden="true">
								{renderContent()}
							</div>
						)
					}
				</div>
			</div>
		);
	};
};
