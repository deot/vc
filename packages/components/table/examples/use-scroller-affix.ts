import { nextTick, onBeforeUnmount, onMounted, reactive } from 'vue';

/**
 * Table 嵌套在 Scroller 里时的 Affix 偏移
 *
 * Affix 按窗口定位：表头的 offset 为 Scroller 视口顶部到窗口顶部的距离，底部 dock 的 offset 为视口底部到窗口底部的距离；
 * 挂载、窗口滚动与尺寸变化时重新计算，变化后让 Table 重算吸附
 * @param getViewport 取 Scroller 的滚动容器（Scroller 实例的 wrapper）；取不到时不计算
 * @param getTable 取 Table 实例
 * @returns 偏移与手动重算方法（如滚动容器重建后）
 */
export const useScrollerAffix = (getViewport: () => HTMLElement | undefined, getTable: () => any) => {
	const offsets = reactive({ top: 0, bottom: 0 });

	const update = () => {
		const el = getViewport();
		if (!el) return;
		// 视口取滚动容器边框内的区域（Scroller 的 class / 边框作用在滚动容器上）
		const viewportTop = el.getBoundingClientRect().top + el.clientTop;
		const top = Math.max(0, viewportTop);
		const bottom = Math.max(0, window.innerHeight - (viewportTop + el.clientHeight));
		if (top === offsets.top && bottom === offsets.bottom) return;
		offsets.top = top;
		offsets.bottom = bottom;
		nextTick(() => getTable()?.refreshAffix());
	};

	onMounted(() => {
		update();
		window.addEventListener('resize', update);
		window.addEventListener('scroll', update, { passive: true });
	});

	onBeforeUnmount(() => {
		window.removeEventListener('resize', update);
		window.removeEventListener('scroll', update);
	});

	return { offsets, update };
};
