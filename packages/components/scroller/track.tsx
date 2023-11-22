/** @jsxImportSource vue */

import { getCurrentInstance, computed, defineComponent, onBeforeUnmount, onMounted, ref, watch, withDirectives, vShow } from 'vue';
import { throttle } from 'lodash-es';
import * as $ from '@deot/helper-dom';
import { raf } from '@deot/helper-utils';
import { TransitionFade } from '../transition';
import { props as trackProps } from './track-props';

const COMPONENT_NAME = 'vc-scroller-track';

const BAR_MAP = {
	vertical: {
		scroll: 'scrollTop',
		size: 'height',
		key: 'vertical',
		axis: 'Y',
		client: 'clientY',
		direction: 'top',
	},
	horizontal: {
		scroll: 'scrollLeft',
		size: 'width',
		key: 'horizontal',
		axis: 'X',
		client: 'clientX',
		direction: 'left',
	}
};

export type TrackExposed = {
	target: HTMLElement;
	scrollTo: (v: number) => void;
};

export const Track = defineComponent({
	name: COMPONENT_NAME,
	props: trackProps,
	emits: ['refresh'],
	setup(props, { emit, expose }) {
		const instance = getCurrentInstance()!;
		const track = ref<HTMLElement>();
		const thumb = ref<HTMLElement>();
		const cursorDown = ref(false);
		const cursorLeave = ref(false);
		const isVisible = ref(false);
		const scrollDistance = ref(0);
		const barOptions = computed(() => BAR_MAP[props.vertical ? 'vertical' : 'horizontal']);

		// 左右距离
		const offsetSum = computed(() => {
			return props.offset[0] + props.offset[1];
		});

		// 滚动条的实际容器大小
		const wrapperFitSize = computed(() => {
			return props.wrapperSize - offsetSum.value;
		});

		// thumb的大小
		const thumbSize = computed(() => {
			const size = wrapperFitSize.value * (props.wrapperSize / props.contentSize);
			return size && size < wrapperFitSize.value ? size : 0;
		});

		const thumbFitSize = computed(() => {
			return Math.max(thumbSize.value, props.thumbMinSize);
		});

		// 最大可移动的距离
		const maxMove = computed(() => {
			return wrapperFitSize.value - thumbSize.value;
		});

		// 滚动时均摊Size
		const averageSize = computed(() => {
			return (Math.max(props.thumbMinSize - thumbSize.value, 0)) / maxMove.value;
		});

		// thumb偏移值
		const thumbMove = computed(() => {
			// thumb应该在当前bar上的偏移值
			const currentMove = (scrollDistance.value / props.wrapperSize) * thumbSize.value;
			// 当前你滚动的距离
			const thumbFitMove = currentMove * (1 - averageSize.value); 
			return thumbFitMove > maxMove.value ? maxMove.value : thumbFitMove;
		});

		// thumb样式
		const thumbCalcStyle = computed(() => {
			const { size } = barOptions.value;
			return {
				[size]: thumbFitSize.value + 'px'
			};
		});

		let originalOnselectstart: any;
		let startMove = 0;
		let startThumbMove = 0;

		const scrollTo = (distance: number) => {
			scrollDistance.value = distance;
		};

		const scrollFitTo = (thumbFitMove: number) => {
			const $scrollDistance = ((thumbFitMove / (1 - averageSize.value)) / thumbSize.value) * props.wrapperSize;

			// 滚动
			emit('refresh', $scrollDistance);
		};

		const handleMouseMoveDocument = (e: MouseEvent) => {
			if (cursorDown.value === false) return;
			if (!startMove) return;

			const { client } = barOptions.value;

			const thumbFitMove = Math.min(
				Math.max(0, startThumbMove + e[client] - startMove),
				maxMove.value
			);

			scrollFitTo(thumbFitMove);
		};

		const handleMouseUpDocument = () => {
			cursorDown.value = false;
			startMove = 0;

			$.off($.el(document.body), 'mousemove', handleMouseMoveDocument);
			$.off($.el(document.body), 'mouseup', handleMouseUpDocument);

			document.body.onselectstart = originalOnselectstart;
			if (cursorLeave.value) {
				isVisible.value = false;
			}
		};

		const startDrag = (e: MouseEvent) => {
			e.stopImmediatePropagation();
			cursorDown.value = true;

			$.on($.el(document.body), 'mousemove', handleMouseMoveDocument);
			$.on($.el(document.body), 'mouseup', handleMouseUpDocument);

			originalOnselectstart = document.body.onselectstart;
			document.body.onselectstart = () => false;
		};

		// 拖动
		const handleClickThumb = (e: MouseEvent) => {
			// 防止中右键点击事件
			e.stopPropagation();
			if (e.ctrlKey || [1, 2].includes(e.button)) {
				return;
			}

			window.getSelection()?.removeAllRanges();

			startDrag(e);

			const { client } = barOptions.value;
			
			startMove = e[client];
			startThumbMove = thumbMove.value;
		};

		// 点击滚动轴
		const handleClickTrack = (e: MouseEvent) => {
			const { client, direction } = barOptions.value;
			const thumbFitMove = e[client] - (e.target as HTMLElement).getBoundingClientRect()[direction] - thumbFitSize.value / 2;

			scrollFitTo(thumbFitMove);
		};

		const handleMouseMove = () => {
			cursorLeave.value = false;
			isVisible.value = !!thumbSize.value;
		};

		const handleLeave = () => {
			cursorLeave.value = true;
			isVisible.value = cursorDown.value;
		};

		const refreshThumb = () => raf(() => { 
			thumb.value!.style[$.prefixStyle('transform').camel] = `translate${barOptions.value.axis}(${thumbMove.value}px)`;
		});
		
		const refreshThrottleThumb = throttle(refreshThumb, 50);

		onMounted(() => {
			const parentEl = instance?.vnode?.el?.parentElement;
			if (!parentEl) return;
			$.on($.el(parentEl), 'mousemove', handleMouseMove);
			$.on($.el(parentEl), 'mouseleave', handleLeave);
		});

		onBeforeUnmount(() => {
			const parentEl = instance?.vnode?.el?.parentElement;
			if (!parentEl) return;
			$.off($.el(document.body), 'mousemove', handleMouseMoveDocument);
			$.off($.el(document.body), 'mouseup', handleMouseUpDocument);
			$.off($.el(parentEl), 'mousemove', handleMouseMove);
			$.off($.el(parentEl), 'mouseleave', handleLeave);
		});


		// 用throttle优化连续变化的transfrom
		watch(
			() => thumbMove.value,
			() => {
				if (!thumb.value) return;
				refreshThrottleThumb();
			},
			{ immediate: true }
		);

		expose({ scrollTo, target: track });

		return () => {
			return (
				<TransitionFade>
					{
						withDirectives(
							(
								<div
									ref={track}
									class={['is-' + barOptions.value.key, 'vc-scroller-track']}
									onMousedown={handleClickTrack}
								>
									<div
										ref={thumb}
										class={[props.thumbClassName, 'vc-scroller-track__thumb']}
										style={[props.thumbStyle!, thumbCalcStyle.value]}
										onMousedown={handleClickThumb}
									/>
								</div>
							),
							[[vShow, thumbSize.value && (props.always || isVisible.value)]]
						)
					}
				</TransitionFade>
			);
		};
	}
});
