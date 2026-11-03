import { computed } from 'vue';
import type { Ref } from 'vue';

type Options = {
	// Scroller 实例，其 content 即标签的容器（nav）
	scroller: Ref<any>;
	// 标签栏是否纵向排列（左右两侧）
	vertical: () => boolean;
	getActiveItem: () => HTMLElement | null | undefined;
	// 选中项滚入可视区的位置：nearest 刚好可见（桌面端），center 尽量居中（移动端）
	align?: 'nearest' | 'center';
};

const KEYS = {
	x: { client: 'clientWidth', scroll: 'scrollWidth', position: 'scrollLeft', offset: 'offsetLeft', length: 'offsetWidth' },
	y: { client: 'clientHeight', scroll: 'scrollHeight', position: 'scrollTop', offset: 'offsetTop', length: 'offsetHeight' }
} as const;

/**
 * 标签栏的溢出滚动（桌面端、移动端共用）：Scroller 承载滚动（axis 锁定方向，滚轮与触摸由它处理），不显示滚动条
 * 1. 前后翻页按钮（stepper）翻一屏、选中项滚入可视区：平滑滚动
 * 2. 可视区或标签尺寸变化后由调用方调用 scrollToActive(false)，选中项保持在可视区内
 * @param options ~
 * @returns ~
 */
export const useTabsScroll = (options: Options) => {
	const { scroller, vertical, getActiveItem, align = 'nearest' } = options;

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

	const scrollTo = (to: number, animated = true) => {
		const el = getWrapper();
		if (!el) return;
		const { position, scroll, client } = keys.value;
		to = Math.round(Math.min(Math.max(0, to), el[scroll] - el[client]));
		if (to === el[position]) return;
		scroller.value.scrollTo({ [axis.value]: to, duration: animated ? 300 : 0 });
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
		if (align === 'center') {
			to = start - (el[client] - item[length]) / 2;
		} else if (start < current) {
			to = start;
		} else if (end > current + el[client]) {
			to = end - el[client];
		}

		scrollTo(to, animated && isPositioned);
		isPositioned = true;
	};

	return {
		axis,
		scrollable,
		isStart,
		isEnd,
		step,
		scrollToActive
	};
};
