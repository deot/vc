import { computed, ref, watch, nextTick, onBeforeUnmount } from 'vue';
import type { Ref } from 'vue';
import { Resize } from '@deot/helper-resize';
import { toRem } from '@deot/vc-shared';
import type { Props } from './popup-props';
import { SNAP_DURATION, ease, getTranslate } from './constants';

// 松手时按速度向前投影的时长（s）
const PROJECTION = 0.2;
// 面板的圆角与安全区随档位一起过渡（is-full）
const PANEL_TRANSITION = ease(['transform', 'border-radius', 'padding'], SNAP_DURATION);
const FOOTER_TRANSITION = ease(['transform'], SNAP_DURATION);
const MASK_TRANSITION = ease(['opacity'], SNAP_DURATION);

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
 * - 偏移（position）：面板相对最高档向外移动的距离，最高档为 0，越低越大
 * - footer 反向位移，在档位范围内始终贴住屏幕边缘；低于最低档（关闭中）时随面板移动
 * - 全屏（面板内侧边缘到达屏幕边缘）时 is-full：圆角打平、内侧留出安全区；离开顶部即恢复
 * @param props ~
 * @param options ~
 * @param options.root 组件根节点（测量探针放在其中，继承局部变量）
 * @param options.wrapper 面板
 * @param options.footer 底部
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
		footer: Ref<HTMLElement | undefined>;
		mask: Ref<HTMLElement | undefined>;
		isActive: Ref<boolean>;
		emitSnap: (index: number) => void;
	}
) => {
	const { root, wrapper, footer, mask, isActive, emitSnap } = options;

	const enabled = computed(() => !!props.snaps?.length && (props.placement === 'bottom' || props.placement === 'top'));
	const heights = ref<number[]>([]);
	const index = ref(0);
	const isFull = ref(false);
	// 最高档的高度与视口高度（探针容器的高度），随 heights 一起更新
	let tallest = 0;
	let available = 0;
	// 面板向外为正：bottom 向下，top 向上
	const sign = computed(() => (props.placement === 'top' ? -1 : 1));
	const side = computed(() => (props.placement === 'top' ? 'top' : 'bottom'));

	const setHeights = (value: number[]) => {
		heights.value = value;
		tallest = value.length ? Math.max(...value) : 0;
	};

	const offsetOf = (i: number) => tallest - (heights.value[i] ?? 0);
	// 偏移为 position 时面板是否铺满视口
	const isFullAt = (position: number) => tallest >= available - 0.5 && position < 0.5;

	/**
	 * 偏移为 position 时露出的高度
	 * @param position ~
	 * @returns px
	 */
	const heightAt = (position: number) => tallest - position;

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
	 * 面板、footer、遮罩画到偏移 position（相对当前档）：footer 在档位范围内反向位移，低于最低档时遮罩变淡
	 * @param position ~
	 */
	const paint = (position: number) => {
		const lowest = offsetOf(0);
		const delta = position - offsetOf(index.value);
		wrapper.value!.style.transform = delta ? `translateY(${sign.value * delta}px)` : '';
		const offset = Math.min(Math.max(position, 0), lowest);
		footer.value && props.placement === 'bottom' && (footer.value.style.transform = offset ? `translateY(${-offset}px)` : '');
		mask.value && (mask.value.style.opacity = position > lowest ? `${1 + progressAt(position)}` : '');
		isFull.value = isFullAt(position);
	};

	const setTransition = (panel: string, others: [string, string]) => {
		wrapper.value!.style.transition = panel;
		footer.value && (footer.value.style.transition = others[0]);
		mask.value && (mask.value.style.transition = others[1]);
	};

	/**
	 * 把当前档写到面板上：高度为最高档，bottom（top）为负的偏移；footer 反向位移
	 */
	const apply = () => {
		const el = wrapper.value;
		if (!el) return;
		if (!enabled.value || !heights.value.length) {
			isFull.value = false;
			el.style.removeProperty('height');
			el.style.removeProperty(side.value);
			footer.value?.style.removeProperty('transform');
			return;
		}
		const offset = offsetOf(index.value);
		el.style.height = `${tallest}px`;
		el.style[side.value] = `${-offset}px`;
		setTransition('none', ['', '']);
		paint(offset);
	};

	/**
	 * 测量各档并写到面板上
	 * @param force 为 false 时（尺寸变化）各档高度没变就不重写
	 */
	const measure = (force = true) => {
		const el = wrapper.value;
		if (!enabled.value || !el || !isActive.value) {
			setHeights([]);
			apply();
			return;
		}
		const [raw, viewport] = measureRaw();
		const value = resolveHeights(raw, measureContent(el), viewport);
		if (!force && viewport === available && value.join() === heights.value.join()) return;
		available = viewport;
		setHeights(value);
		index.value = clampIndex(index.value);
		apply();
	};

	let timer: ReturnType<typeof setTimeout> | undefined;

	/**
	 * 面板此刻的偏移（相对最高档）：档位过渡中按面板此刻所在的位置，而不是过渡前的档
	 * @returns ~
	 */
	const current = () => {
		const offset = offsetOf(index.value);
		return timer && wrapper.value ? offset + sign.value * getTranslate(wrapper.value, 'y') : offset;
	};

	/**
	 * 跟手开始：停在 position（过渡中被抓住时停在此刻的位置，不再提交过渡的目标档），去掉过渡
	 * @param position ~
	 */
	const grab = (position: number) => {
		clearTimeout(timer);
		timer = undefined;
		setTransition('none', ['none', 'none']);
		paint(position);
	};

	/**
	 * 从当前位置过渡到第 i 档，结束后提交（bottom / top 与档位）
	 * @param i ~
	 */
	const snapTo = (i: number) => {
		const el = wrapper.value;
		if (!el || !heights.value.length) return;
		clearTimeout(timer);
		const target = clampIndex(i);
		// 已在目标档且没有跟手位移时直接提交
		const moving = target !== index.value || !!el.style.transform;
		setTransition(PANEL_TRANSITION, [FOOTER_TRANSITION, MASK_TRANSITION]);
		paint(offsetOf(target));
		timer = setTimeout(() => {
			timer = undefined;
			const changed = target !== index.value;
			index.value = target;
			apply();
			changed && emitSnap(target);
		}, moving ? SNAP_DURATION : 0);
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
		const progress = progressAt(position);
		if (swipe && progress < 0 && (-progress >= swipe.threshold || velocity > swipe.speed)) return 'close' as const;
		const target = pickSnap(heights.value.map((_, i) => offsetOf(i)), position + velocity * PROJECTION);
		snapTo(target);
		return target;
	};

	// 指示器：切到下一档（高度更高的一档），到顶后回到最低档
	const next = () => {
		const height = heights.value[index.value];
		const higher = heights.value.findIndex((h, i) => i > index.value && h > height);
		snapTo(higher === -1 ? 0 : higher);
	};

	const reset = () => {
		clearTimeout(timer);
		timer = undefined;
		const el = wrapper.value;
		if (el) {
			el.style.removeProperty('transition');
			el.style.removeProperty('transform');
		}
	};

	// 打开时定位到 snap 档；打开期间内容或视口尺寸变化时重新测量
	const handleResize = () => measure(false);
	let observed: HTMLElement | undefined;
	const observe = (el?: HTMLElement) => {
		if (observed === el) return;
		observed ? Resize.off(observed, handleResize) : window.addEventListener('resize', handleResize);
		el ? Resize.on(el, handleResize) : window.removeEventListener('resize', handleResize);
		observed = el;
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
		v => isActive.value && v !== index.value && snapTo(v ?? 0)
	);

	onBeforeUnmount(() => {
		clearTimeout(timer);
		observe();
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
		current,
		grab,
		follow: paint,
		release,
		snapTo,
		next,
		reset
	};
};

export type PopupSnaps = ReturnType<typeof usePopupSnaps>;
