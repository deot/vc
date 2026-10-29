import { ref, onMounted, onBeforeUnmount } from 'vue';
import type { Ref } from 'vue';
import { Resize } from '@deot/helper-resize';
import type { GridBreakpoint, GridResponsive } from '../types';
import { getBreakpoint, isResponsive, resolveResponsive } from '../utils';

const SHARED = { shared: true };

// 所有实例共用一个ResizeObserver，按元素找回各自的更新函数
const updaters = new WeakMap<Element, (width: number) => void>();
const handleResize = (entries: ResizeObserverEntry[]) => {
	entries.forEach((entry) => {
		const width = entry.borderBoxSize?.[0]?.inlineSize ?? entry.target.getBoundingClientRect().width;
		updaters.get(entry.target)?.(width);
	});
};

/**
 * 按容器宽度解析响应式值
 * 	- 只有解析过响应式对象时才监听容器尺寸，全是固定值时不监听
 * 	- 断点变化时才触发更新；只有读取过响应式对象的渲染会依赖断点
 * @param target 容器
 * @returns ~
 */
export const useResponsive = (target: Ref<HTMLElement | undefined>) => {
	const breakpoint = ref<GridBreakpoint>('xs');

	let isNeeded = false;
	let el: HTMLElement | undefined;

	const update = (width: number) => {
		const v = getBreakpoint(width);
		v !== breakpoint.value && (breakpoint.value = v);
	};

	// 挂载前target为空，等onMounted再开始
	const observe = () => {
		if (el || !target.value) return;
		el = target.value;
		// 先同步取一次，避免首帧使用默认断点
		update(el.getBoundingClientRect().width);
		updaters.set(el, update);
		Resize.on(el, handleResize, SHARED);
	};

	const resolve = <T>(value: GridResponsive<T> | undefined, fallback: T): T => {
		if (!isResponsive(value)) return value ?? fallback;
		isNeeded = true;
		observe();
		return resolveResponsive(value, breakpoint.value, fallback);
	};

	onMounted(() => {
		isNeeded && observe();
	});

	onBeforeUnmount(() => {
		if (!el) return;
		Resize.off(el, handleResize, SHARED);
		updaters.delete(el);
		el = void 0;
	});

	return { resolve };
};
