import { getCurrentInstance, computed, onBeforeUnmount, onMounted, watch } from 'vue';
import type { Props } from './scroller-props';
import type { useScrollerState } from './use-scroller';
import { bindWheel } from './wheel';

/**
 * 接管滚轮，在rAF中写入滚动位置
 * 1. 滚轮驱动：wheel=true 且不使用原生滚动条（native=false 或 always=true）；容器 overflow: hidden，触摸为模拟滚动
 * 2. axis：只在该方向滚动，纵横增量都用于该方向；容器可原生滚动，触摸交给浏览器
 * 运行时切换会重新绑定
 * @param scroller useScrollerState 的返回值
 * @returns isWheel 是否由滚轮驱动；handleNativeScroll 根节点的 scroll 处理
 */
export const useWheel = (scroller: ReturnType<typeof useScrollerState>) => {
	const instance = getCurrentInstance()!;
	const props = instance.props as Props;
	const { wrapper, scrollX, scrollY, isNative, state, handleScroll } = scroller;

	const isWheel = computed(() => props.wheel && !isNative.value);
	// 是否接管滚轮；滚轮驱动时还要模拟触摸
	const mode = computed(() => (isWheel.value ? 'drive' : props.axis ? 'axis' : ''));

	let unbind: (() => void) | undefined;
	const bind = () => {
		unbind?.();
		unbind = undefined;
		if (!wrapper.value || !mode.value) return;
		unbind = bindWheel(wrapper.value, () => state, {
			axis: () => props.axis,
			touch: mode.value === 'drive',
			stopPropagation: () => props.stopPropagation
		});
	};

	onMounted(bind);
	watch(mode, bind);
	onBeforeUnmount(() => unbind?.());

	/**
	 * 接管滚轮时，非wheel引起的滚动（聚焦、scrollIntoView、页内查找、触摸、直接写scrollTop等）也要同步位置，否则下次wheel会从旧位置跳回
	 * 自身scrollTo写入后触发的scroll与记录值一致，跳过以免重复派发（容差1px兼容小数像素取整）
	 */
	const handleNativeScroll = () => {
		const el = wrapper.value;
		// 卸载后节点上排队的 scroll 仍会派发（如弹层关闭前刚滚动过）
		if (!el) return;
		if (
			mode.value
			&& Math.abs(el.scrollTop - scrollY.value) < 1
			&& Math.abs(el.scrollLeft - scrollX.value) < 1
		) return;

		handleScroll();
	};

	return {
		isWheel,
		handleNativeScroll
	};
};
