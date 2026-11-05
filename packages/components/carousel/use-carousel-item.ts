import { getCurrentInstance, ref, computed, onBeforeMount, onBeforeUnmount, inject } from 'vue';
import type { SetupContext } from 'vue';
import { prefixStyle } from '@deot/helper-dom';
import { VcError } from '../vc/index';
import { Props } from './carousel-item-props';

const TRANSFORM = prefixStyle('transform').camel;

/**
 * @param expose ~
 * @param options ~
 * @param options.rem gap 为 750 稿长度（移动端），位移中的 gap 由 CSS 按 --vc-rem 换算
 * @returns ~
 */
export const useCarouselItem = (expose: SetupContext['expose'], options: { rem?: boolean } = {}) => {
	const instance = getCurrentInstance()!;
	const carousel = inject('vc-carousel', {} as any);

	const props = instance.props as Props;

	// 位移 = translate（px）+ gaps × gap；gap 部分交给 CSS，拖动时不需要读取样式
	const translate = ref(0);
	const gaps = ref(0);
	const currentScale = ref(1);
	const isHover = ref(false);
	const isActive = ref(false);
	const isReady = ref(false);
	const isInStage = ref(false);
	const isAnimating = ref(false);

	const isVertical = computed(() => {
		return carousel.props.vertical;
	});

	const isCard = computed(() => {
		return carousel.props.card;
	});

	const isMove = computed(() => {
		return carousel.offset.value !== 0;
	});

	const itemGap = computed(() => {
		return props.gap || carousel.props.gap || 0;
	});

	const translateValue = computed(() => {
		const gap = gaps.value * itemGap.value;
		if (!gap) return `${translate.value}px`;
		return options.rem
			? `calc(${translate.value}px + var(--vc-rem) * ${gap})`
			: `${translate.value + gap}px`;
	});

	const itemStyle = computed(() => {
		const translateType = isVertical.value ? 'translateY' : 'translateX';
		return {
			[TRANSFORM]: `${translateType}(${translateValue.value}) scale(${currentScale.value})`,
			// 只有当设置了gap, width才能生效, 且宽度要>50%，否则会失效
			width: carousel.props.card || itemGap.value ? props.width : '100%'
		};
	});

	onBeforeMount(() => {
		carousel.add?.(instance);

		// 检查语法
		if (
			!isCard.value
			&& itemGap.value
			&& carousel.props.loop
		) {
			throw new VcError('carousel', 'slide模式下loop不能为true');
		}
	});

	onBeforeUnmount(() => {
		carousel.remove?.(instance);
	});

	const processIndex = (index: number, activeIndex: number, length: number) => {
		if (activeIndex === 0 && index === length - 1) {
			return -1;
		} else if (activeIndex === length - 1 && index === 0) {
			return length;
		} else if (index < activeIndex - 1 && activeIndex - index >= length / 2) {
			return length + 1;
		} else if (index > activeIndex + 1 && index - activeIndex >= length / 2) {
			return -2;
		}
		return index;
	};

	/**
	 * 位移拆成 [px, gap 的个数]，gap 的长度由 itemStyle 决定单位
	 * @param index ~
	 * @param activeIndex ~
	 * @returns ~
	 */
	const calcCardTranslate = (index: number, activeIndex: number): [number, number] => {
		const widthNumber = (+props.width) / 100;
		const parentW = carousel.wrapper.value.offsetWidth;
		// 修改了计算公式
		if (isInStage.value) {
			if (index > activeIndex) {
				return [(parentW * (1 + widthNumber * props.scale)) / 2, 1];
			} else if (index < activeIndex) {
				return [-(parentW * ((widthNumber * props.scale - 1) / 2 + widthNumber)), -1];
			}
		}
		return [(parentW * (1 - widthNumber)) / 2, 0];
	};

	/**
	 * 暂不考虑宽度 < 50% 的情况
	 * 如果考虑，需要判断-2的情况，更小则还要判断-3的情况
	 * @param index ~
	 * @param activeIndex ~
	 * @param wrapperWidth ~
	 * @returns [px, gap 的个数]
	 */
	const calcSlideOffset = (index: number, activeIndex: number, wrapperWidth: number): [number, number] => {
		const { length } = carousel.items.value;
		const offset = wrapperWidth - (carousel.wrapper?.value?.offsetWidth || 0);

		if (!itemGap.value || isVertical.value) return [0, 0];

		// 居中
		if (length === 1) {
			return [offset / 2, 0];
		}

		const diff = index - activeIndex;

		// 头
		if (activeIndex == 0) {
			if (diff === 0) return [0, 1];
			if (diff === 1) return [-offset, 2];
		}

		// 中
		if (activeIndex !== 0 && activeIndex != length - 1) {
			if (diff === 0) return [offset / 2, 0];
			if (diff === 1) return [-offset / 2, 1];
			if (diff === -1) return [(offset * 3) / 2, -1];
		}

		// 尾
		if (activeIndex == length - 1) {
			if (diff === 0) return [offset, -1];
			if (diff === -1) return [offset * 2, -2];
		}

		return [0, 0];
	};

	const calcTranslate = (index: number, activeIndex: number): [number, number] => {
		const distance = carousel.wrapper.value[isVertical.value ? 'offsetHeight' : 'offsetWidth'];
		const [slideOffset, slideGaps] = calcSlideOffset(index, activeIndex, distance);

		return [distance * (index - activeIndex) + carousel.offset.value + slideOffset, slideGaps];
	};

	const reset = (index: number, activeIndex: number, oldIndex: number) => {
		const { length } = carousel.items.value;
		if (
			carousel.allowTransition.value
			&& !isCard.value
			&& oldIndex !== undefined
		) {
			isAnimating.value = index === activeIndex || index === oldIndex;
			// 如果有边距且没有设置动画，前后需要添加动画
			if (!isVertical.value
				&& !isAnimating.value
				&& itemGap.value
				&& (index - activeIndex === 1 || index - activeIndex === -1)
			) {
				isAnimating.value = true;
			}
		}
		if (index !== activeIndex && length > 2 && carousel.props.loop) {
			index = processIndex(index, activeIndex, length);
		}
		if (isCard.value) {
			if (isVertical.value) {
				throw new VcError('carousel', '卡片模式不支持垂直方向');
			}
			isInStage.value = Math.round(Math.abs(index - activeIndex)) <= 1;
			isActive.value = index === activeIndex;
			[translate.value, gaps.value] = calcCardTranslate(index, activeIndex);
			currentScale.value = isActive.value ? 1 : props.scale;
		} else {
			isActive.value = index === activeIndex;
			[translate.value, gaps.value] = calcTranslate(index, activeIndex);
		}

		isReady.value = true;
	};

	const handleItemClick = () => {
		if (isCard.value) {
			const index = carousel.items.value.indexOf(instance);
			carousel.setActiveItem(index);
		}
	};

	expose({
		reset,
		isInStage,
		isHover,
		isActive
	});

	return {
		translate,
		currentScale,
		isHover,
		isActive,
		isReady,
		isInStage,
		isAnimating,
		isVertical,
		isCard,
		isMove,
		itemGap,
		itemStyle,

		reset,
		handleItemClick
	};
};
