import { computed, ref, watch, nextTick, onMounted, onBeforeUnmount } from 'vue';
import type { Ref } from 'vue';
import { Resize } from '@deot/helper-resize';
import { toRem } from '@deot/vc-shared';
import type { Props } from './popup-props';

// 档位之间的过渡；松手时按速度向前投影的时长（s）
export const SNAP_DURATION = 300;
const PROJECTION = 0.2;
const SNAP_EASING = 'cubic-bezier(0.34, 0.69, 0.1, 1)';

/**
 * 各档的实际高度：不超过内容的自然高度与视口高度；保持与 snaps 一一对应（序号即 v-model:snap），相同高度保留
 * @param raw 各档换算后的 px
 * @param content 内容的自然高度
 * @param available 视口高度
 * @returns 各档的实际高度
 */
export const resolveHeights = (raw: number[], content: number, available: number) => {
	return raw.map(h => Math.round(Math.max(0, Math.min(h, content, available))));
};

/**
 * 松手后吸附到的档：按投影位置取最近的一档，距离相同取较低的一档
 * @param offsets 各档的偏移（最高档为 0，越低越大）
 * @param projected 投影后的偏移
 * @returns 档的序号
 */
export const pickSnap = (offsets: number[], projected: number) => {
	let index = 0;
	offsets.forEach((offset, i) => {
		if (Math.abs(offset - projected) < Math.abs(offsets[index] - projected)) index = i;
	});
	return index;
};

/**
 * 多档高度：面板固定为最高档的高度，用 bottom（top）把其余部分放到屏幕外；拖动时只写 transform，松手后过渡到目标档再提交
 * - 偏移（offset）：面板相对最高档向外移动的距离，最高档为 0，越低越大
 * - footer 反向位移，在档位范围内始终贴住屏幕边缘；低于最低档（关闭中）时随面板移动
 * - 全屏（面板内侧边缘到达屏幕边缘）时 is-full：圆角打平、内侧留出安全区；离开顶部即恢复
 * @param props ~
 * @param options ~
 * @param options.root 组件根节点（测量探针放在其中，继承局部变量）
 * @param options.wrapper 面板
 * @param options.mask 遮罩
 * @param options.isActive 是否显示
 * @param options.emitSnap 档位变化
 * @returns 档位状态与操作
 */
export const usePopupSnaps = (
	props: Props,
	options: {
		root: Ref<HTMLElement | undefined>;
		wrapper: Ref<HTMLElement | undefined>;
		mask: Ref<HTMLElement | undefined>;
		isActive: Ref<boolean>;
		emitSnap: (index: number) => void;
	}
) => {
	const { root, wrapper, mask, isActive, emitSnap } = options;

	const enabled = computed(() => !!props.snaps?.length && (props.placement === 'bottom' || props.placement === 'top'));
	const heights = ref<number[]>([]);
	const index = ref(0);
	const isFull = ref(false);
	// 视口高度（探针容器的高度）
	let available = 0;
	// 面板向外为正：bottom 向下，top 向上
	const sign = computed(() => (props.placement === 'top' ? -1 : 1));
	const side = computed(() => (props.placement === 'top' ? 'top' : 'bottom'));

	const max = () => (heights.value.length ? Math.max(...heights.value) : 0);
	const offsetOf = (i: number) => max() - (heights.value[i] ?? 0);
	const offsets = () => heights.value.map((_, i) => offsetOf(i));
	// 偏移为 position 时面板是否铺满视口
	const isFullAt = (position: number) => !!heights.value.length && max() >= available - 0.5 && position < 0.5;
	/**
	 * 偏移为 position 时露出的高度
	 * @param position ~
	 * @returns px
	 */
	const heightAt = (position: number) => max() - position;

	/**
	 * 偏移为 position 时的进度：最低档为 0、最高档为 1；低于最低档为负，滑出一个最低档的高度为 -1
	 * @param position ~
	 * @returns [-1, 1]
	 */
	const progressAt = (position: number) => {
		const lowest = offsetOf(0);
		if (position <= lowest) return lowest > 0 ? 1 - position / lowest : 0;
		return -Math.min(1, (position - lowest) / (heights.value[0] || 1));
	};

	const clampIndex = (i: number) => Math.min(Math.max(0, Math.round(i) || 0), Math.max(0, heights.value.length - 1));

	// 不在最高档时锁定内容区的滚动：内容的下半部分在屏幕外
	const isLocked = computed(() => enabled.value && heights.value.length > 1 && offsetOf(index.value) > 0);

	const getFooter = () => wrapper.value?.querySelector<HTMLElement>(':scope > .vcm-popup__footer') || null;

	/**
	 * 把各档换算成 px：放进一个高度为视口高度的探针，百分比相对视口高度，calc / var / env / --vc-rem 都按样式计算
	 * @returns [各档 px, 视口高度]
	 */
	const measureRaw = (): [number[], number] => {
		const container = document.createElement('div');
		container.style.cssText = 'position: fixed; top: 0; left: 0; width: 0; height: 100%; visibility: hidden; pointer-events: none;';
		(props.snaps || []).forEach((value) => {
			const probe = document.createElement('div');
			probe.style.height = typeof value === 'number' ? toRem(value) : value;
			container.appendChild(probe);
		});
		(root.value || document.body).appendChild(container);
		const result = [...container.children].map(el => (el as HTMLElement).offsetHeight);
		const viewport = container.offsetHeight;
		container.remove();
		return [result, viewport];
	};

	// 内容的自然高度：各部分自身的高度，内容区取其内容的高度（不受面板高度限制）
	const measureContent = (el: HTMLElement) => {
		const style = window.getComputedStyle(el);
		let height = (parseFloat(style.paddingTop) || 0) + (parseFloat(style.paddingBottom) || 0);
		[...el.children].forEach((child) => {
			const node = child as HTMLElement;
			const content = node.classList.contains('vcm-popup__scroller')
				? node.querySelector<HTMLElement>('.vcm-popup__content')
				: null;
			height += (content || node).offsetHeight;
		});
		return height;
	};

	/**
	 * 把当前档写到面板上：高度为最高档，bottom（top）为负的偏移；footer 反向位移
	 */
	const apply = () => {
		const el = wrapper.value;
		if (!el) return;
		const footer = getFooter();
		if (!enabled.value || !heights.value.length) {
			isFull.value = false;
			el.style.removeProperty('height');
			el.style.removeProperty(side.value);
			footer && footer.style.removeProperty('transform');
			return;
		}
		const offset = offsetOf(index.value);
		isFull.value = isFullAt(offset);
		el.style.height = `${max()}px`;
		el.style[side.value] = `${-offset}px`;
		if (footer) {
			footer.style.transition = '';
			footer.style.transform = props.placement === 'bottom' && offset ? `translateY(${-offset}px)` : '';
		}
	};

	const measure = () => {
		const el = wrapper.value;
		if (!enabled.value || !el || !isActive.value) {
			heights.value = [];
			apply();
			return;
		}
		const [raw, viewport] = measureRaw();
		available = viewport;
		heights.value = resolveHeights(raw, measureContent(el), available);
		index.value = clampIndex(index.value);
		apply();
	};

	/**
	 * 跟手：position 为相对最高档的偏移；低于最低档时遮罩变淡，footer 随面板移动
	 * @param position ~
	 */
	const follow = (position: number) => {
		const el = wrapper.value;
		if (!el) return;
		const base = offsetOf(index.value);
		const lowest = offsetOf(0);
		el.style.transition = 'none';
		el.style.transform = `translateY(${sign.value * (position - base)}px)`;
		isFull.value = isFullAt(position);
		const footer = getFooter();
		if (footer && props.placement === 'bottom') {
			footer.style.transition = 'none';
			footer.style.transform = `translateY(${-Math.min(Math.max(position, 0), lowest)}px)`;
		}
		if (mask.value) {
			const lowestHeight = heights.value[0] || 1;
			mask.value.style.transition = 'none';
			mask.value.style.opacity = position > lowest ? `${Math.max(0, 1 - (position - lowest) / lowestHeight)}` : '';
		}
	};

	let timer: ReturnType<typeof setTimeout> | undefined;
	const transition = `transform ${SNAP_DURATION}ms ${SNAP_EASING}`;
	// 圆角与安全区随档位一起过渡
	const panelTransition = ['transform', 'border-radius', 'padding'].map(key => `${key} ${SNAP_DURATION}ms ${SNAP_EASING}`).join(', ');

	/**
	 * 从当前位置过渡到第 i 档，结束后提交（bottom / top 与档位）
	 * @param i ~
	 */
	const snapTo = (i: number) => {
		const el = wrapper.value;
		if (!el || !heights.value.length) return;
		clearTimeout(timer);
		const target = clampIndex(i);
		const delta = offsetOf(target) - offsetOf(index.value);
		el.style.transition = panelTransition;
		isFull.value = isFullAt(offsetOf(target));
		el.style.transform = delta ? `translateY(${sign.value * delta}px)` : '';
		const footer = getFooter();
		if (footer && props.placement === 'bottom') {
			footer.style.transition = transition;
			footer.style.transform = offsetOf(target) ? `translateY(${-offsetOf(target)}px)` : '';
		}
		if (mask.value) {
			mask.value.style.transition = `opacity ${SNAP_DURATION}ms ${SNAP_EASING}`;
			mask.value.style.opacity = '';
		}
		timer = setTimeout(() => {
			el.style.transition = 'none';
			el.style.transform = '';
			const changed = target !== index.value;
			index.value = target;
			apply();
			mask.value && (mask.value.style.transition = '');
			changed && emitSnap(target);
		}, delta ? SNAP_DURATION : 0);
	};

	/**
	 * 松手：按速度投影后吸附；低于最低档且满足关闭条件时返回 'close'（由调用方滑出并关闭）
	 * @param position 相对最高档的偏移
	 * @param velocity 向外为正的速度（px/s）
	 * @param swipe 关闭条件；为 null 时低于最低档只回弹
	 * @param swipe.threshold ~
	 * @param swipe.speed ~
	 * @returns 'close' 或吸附到的档
	 */
	const release = (position: number, velocity: number, swipe: { threshold: number; speed: number } | null) => {
		const lowest = offsetOf(0);
		const beyond = position - lowest;
		if (swipe && beyond > 0 && (beyond / (heights.value[0] || 1) >= swipe.threshold || velocity > swipe.speed)) {
			return 'close' as const;
		}
		const target = pickSnap(offsets(), position + velocity * PROJECTION);
		snapTo(target);
		return target;
	};

	// 指示器：切到下一档（高度更高的一档），到顶后回到最低档
	const next = () => {
		const current = heights.value[index.value];
		const higher = heights.value.findIndex((h, i) => i > index.value && h > current);
		snapTo(higher === -1 ? 0 : higher);
	};

	const reset = () => {
		clearTimeout(timer);
		const el = wrapper.value;
		if (el) {
			el.style.removeProperty('transition');
			el.style.removeProperty('transform');
		}
	};

	// 打开时定位到 snap 档；内容或视口尺寸变化时重新测量
	const handleResize = () => isActive.value && enabled.value && measure();
	let observed: HTMLElement | undefined;
	const observe = (el?: HTMLElement) => {
		if (observed === el) return;
		observed && Resize.off(observed, handleResize);
		observed = el;
		el && Resize.on(el, handleResize);
	};

	watch(
		() => [isActive.value, enabled.value] as const,
		([active, on]) => {
			if (!active || !on) {
				observe();
				return;
			}
			index.value = props.snap ?? 0;
			// 面板已显示（v-show），进入动画的第一帧之前测量
			nextTick(() => {
				measure();
				observe(wrapper.value?.querySelector<HTMLElement>('.vcm-popup__content') || wrapper.value);
			});
		},
		{ immediate: true }
	);

	// 按值比较：模板里的内联数组（:snaps="['50%', '100%']"）每次父级渲染都是新数组，内容没变时不重新测量
	watch(() => JSON.stringify(props.snaps || []), () => isActive.value && nextTick(measure));

	watch(
		() => props.snap,
		(v) => {
			if (!isActive.value || !heights.value.length || v === index.value) return;
			snapTo(v ?? 0);
		}
	);

	const handleWindowResize = () => handleResize();
	onMounted(() => window.addEventListener('resize', handleWindowResize));
	onBeforeUnmount(() => {
		clearTimeout(timer);
		observe();
		window.removeEventListener('resize', handleWindowResize);
	});

	return {
		enabled,
		heights,
		index,
		isLocked,
		isFull,
		offsetOf,
		heightAt,
		progressAt,
		follow,
		release,
		snapTo,
		next,
		reset,
		measure
	};
};

export type PopupSnaps = ReturnType<typeof usePopupSnaps>;
