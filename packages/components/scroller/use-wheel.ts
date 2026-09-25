import { getCurrentInstance, computed, onBeforeUnmount, onMounted, watch } from 'vue';
import { Wheel } from '@deot/helper-wheel';
import type { Ref } from 'vue';
import type { Props } from './scroller-props';
import type { useScroller } from './use-scroller';

/**
 * 滚轮驱动：接管滚轮（触摸设备上为模拟的触摸滚动），在rAF中写入滚动位置
 * wheel=true 且 native=false 时生效，运行时切换会绑定 / 解绑
 * @param scroller useScroller 的返回值
 * @returns isWheel 是否由滚轮驱动；handleNativeScroll 根节点的 scroll 处理
 */
export const useWheel = (scroller: ReturnType<typeof useScroller>) => {
	const instance = getCurrentInstance()!;
	const props = instance.props as Props;
	const {
		wrapper,
		scrollX,
		scrollY,
		wrapperW,
		wrapperH,
		contentH,
		contentW,
		scrollTo,
		handleScroll
	} = scroller;

	const isWheel = computed(() => props.wheel && !props.native);

	const handleWheel = (deltaX: number, deltaY: number) => {
		const options: any = {};
		if (
			Math.abs(deltaY) > Math.abs(deltaX)
			&& contentH.value > wrapperH.value
		) {
			options.y = Math.min(
				Math.max(0, scrollY.value + deltaY),
				contentH.value - wrapperH.value
			);
		} else if (deltaX && contentW.value > wrapperW.value) {
			options.x = Math.min(
				Math.max(0, scrollX.value + deltaX),
				contentW.value - wrapperW.value
			);
		}
		scrollTo(options);
	};

	/**
	 * 某轴是否允许滚动：有溢出、增量取整后非0，且未到该方向的边界
	 * @param position 滚动位置
	 * @param client 可视尺寸
	 * @param content 内容尺寸
	 * @returns 判断函数
	 */
	const createShouldWheel = (position: Ref<number>, client: Ref<number>, content: Ref<number>) => (delta: number) => {
		if (client.value === content.value) return false;

		delta = Math.round(delta);
		if (delta === 0) return false;

		return delta < 0
			? position.value > 0
			: position.value < content.value - client.value;
	};

	// 挂载时绑定一次，之后只在 isWheel 变化时切换
	let wheel: Wheel | undefined;
	const bind = (value: boolean) => {
		if (!wrapper.value) return;
		if (value) {
			wheel = wheel || new Wheel(
				wrapper.value,
				{
					shouldWheelX: createShouldWheel(scrollX, wrapperW, contentW),
					shouldWheelY: createShouldWheel(scrollY, wrapperH, contentH),
					stopPropagation: () => {
						return props.stopPropagation;
					}
				}
			);
			wheel.on(handleWheel);
		} else {
			wheel?.off(handleWheel);
		}
	};

	onMounted(() => bind(isWheel.value));
	watch(isWheel, bind);
	onBeforeUnmount(() => bind(false));

	/**
	 * 滚轮驱动时，非wheel引起的滚动（聚焦、scrollIntoView、页内查找、直接写scrollTop等）也要同步位置，否则下次wheel会从旧位置跳回
	 * 自身scrollTo写入后触发的scroll与记录值一致，跳过以免重复派发（容差1px兼容小数像素取整）
	 */
	const handleNativeScroll = () => {
		const el = wrapper.value!;
		if (
			isWheel.value
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
