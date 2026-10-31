import { computed, onMounted, onBeforeUnmount } from 'vue';
import type { Ref } from 'vue';
import { Wheel } from '@deot/helper-wheel';
import { scrollIntoView } from '@deot/helper-dom';

type Options = {
	// Scroller 实例，其 content 即标签的容器（nav）
	scroller: Ref<any>;
	// 标签栏是否纵向排列（左右两侧）
	vertical: () => boolean;
	getActiveItem: () => HTMLElement | null | undefined;
};

const KEYS = {
	x: { client: 'clientWidth', scroll: 'scrollWidth', position: 'scrollLeft', offset: 'offsetLeft', length: 'offsetWidth' },
	y: { client: 'clientHeight', scroll: 'scrollHeight', position: 'scrollTop', offset: 'offsetTop', length: 'offsetHeight' }
} as const;

/**
 * 桌面端标签栏的溢出滚动：Scroller 承载滚动，不显示滚动条
 * 1. 前后翻页按钮（stepper）翻一屏、选中项滚入可视区：平滑滚动（scrollIntoView）
 * 2. 滚轮：横向排列时纵向滚轮也滚动标签栏；滚到边界后交还给页面
 * 3. 可视区或标签尺寸变化后由调用方调用 scrollToActive(false)，选中项保持在可视区内
 * @param options ~
 * @returns ~
 */
export const useTabsScroll = (options: Options) => {
	const { scroller, vertical, getActiveItem } = options;

	const axis = computed(() => (vertical() ? 'y' : 'x'));
	const keys = computed(() => KEYS[axis.value]);

	// 渲染用：Scroller 暴露的尺寸与位置是响应式的（content 即 nav，标签增减时 Scroller 自己会刷新）
	const max = computed(() => {
		if (!scroller.value) return 0;
		return Math.max(0, scroller.value[keys.value.scroll] - scroller.value[keys.value.client]);
	});
	const scrollable = computed(() => max.value > 0);
	const isStart = computed(() => !scroller.value || scroller.value[keys.value.position] <= 0);
	// 容差1px兼容小数像素取整
	const isEnd = computed(() => !scroller.value || scroller.value[keys.value.position] >= max.value - 1);

	// 操作用：直接读 DOM，与当前布局一致
	const getWrapper = () => scroller.value?.wrapper as HTMLElement | undefined;

	let controller: AbortController | undefined;
	const abort = () => {
		controller?.abort();
		controller = undefined;
	};

	const scrollTo = (to: number, animated = true) => {
		const el = getWrapper();
		if (!el) return;
		const { position, scroll, client } = keys.value;
		const from = el[position];
		to = Math.round(Math.min(Math.max(0, to), el[scroll] - el[client]));
		if (to === from) return;

		abort();
		if (!animated) {
			scroller.value.scrollTo({ [axis.value]: to });
			return;
		}
		controller = new AbortController();
		scrollIntoView(el, { axis: axis.value, from, to, duration: 300, signal: controller.signal });
	};

	/**
	 * 翻一屏
	 * @param direction 1 为向后，-1 为向前
	 */
	const step = (direction: number) => {
		const el = getWrapper();
		el && scrollTo(el[keys.value.position] + direction * el[keys.value.client]);
	};

	// 首次定位（挂载时）不需要动画
	let isPositioned = false;
	const scrollToActive = (animated = true) => {
		const el = getWrapper();
		const item = getActiveItem();
		if (!el || !item) return;

		const { position, client, offset, length } = keys.value;
		const start = item[offset];
		const end = start + item[length];
		const current = el[position];

		let to = current;
		if (start < current) {
			to = start;
		} else if (end > current + el[client]) {
			to = end - el[client];
		}

		scrollTo(to, animated && isPositioned);
		isPositioned = true;
	};

	// 边界判断沿用 helper-wheel：两个方向的增量都用于标签栏的排列方向
	const shouldWheel = (delta: number) => {
		const el = getWrapper();
		if (!el) return false;
		return vertical() ? Wheel.shouldWheelY(el, delta) : Wheel.shouldWheelX(el, delta);
	};

	const handleWheel = (deltaX: number, deltaY: number) => {
		const el = getWrapper();
		el && scrollTo(el[keys.value.position] + deltaX + deltaY, false);
	};

	let wheel: Wheel | undefined;
	onMounted(() => {
		const el = getWrapper();
		if (!el) return;
		wheel = new Wheel(el, { shouldWheelX: shouldWheel, shouldWheelY: shouldWheel });
		wheel.on(handleWheel);
	});

	onBeforeUnmount(() => {
		abort();
		wheel?.off(handleWheel);
	});

	return {
		scrollable,
		isStart,
		isEnd,
		step,
		scrollToActive
	};
};
