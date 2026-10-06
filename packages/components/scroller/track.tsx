/** @jsxImportSource vue */

import { getCurrentInstance, computed, defineComponent, onBeforeUnmount, onMounted, ref, watch, withModifiers } from 'vue';
import { throttle } from 'lodash-es';
import { raf } from '@deot/helper-utils';
import * as $ from '@deot/helper-dom';
import { useDrag } from '@deot/vc-hooks';
import type { DragPoint } from '@deot/vc-hooks';
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
	refreshHover: () => void;
};

export const Track = defineComponent({
	name: COMPONENT_NAME,
	props: trackProps,
	emits: ['change'],
	inheritAttrs: false,
	setup(props, { emit, expose, attrs }) {
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
			return wrapperFitSize.value - thumbFitSize.value;
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

		let startMove = 0;
		let startThumbMove = 0;

		const scrollTo = (distance: number) => {
			scrollDistance.value = distance;
		};

		const scrollFitTo = (thumbFitMove: number) => {
			thumbFitMove = Math.min(Math.max(thumbFitMove, 0), maxMove.value);

			scrollDistance.value = ((thumbFitMove / (1 - averageSize.value)) / thumbSize.value) * props.wrapperSize;

			// 滚动
			emit('change', scrollDistance.value);
		};

		const handleMouseMoveDocument = (e: DragPoint) => {
			const { client } = barOptions.value;

			const thumbFitMove = Math.min(
				Math.max(0, startThumbMove + e[client] - startMove),
				maxMove.value
			);

			scrollFitTo(thumbFitMove);
		};

		const handleMouseUpDocument = () => {
			cursorDown.value = false;

			if (cursorLeave.value) {
				isVisible.value = false;
			}
		};

		// 拖动
		const handleClickThumb = (e: MouseEvent | TouchEvent, point: DragPoint) => {
			// ctrl + 点击会弹出右键菜单
			if (e.ctrlKey) return false;

			window.getSelection()?.removeAllRanges();

			e.stopImmediatePropagation();
			cursorDown.value = true;

			const { client } = barOptions.value;

			startMove = point[client];
			startThumbMove = thumbMove.value;
			return true;
		};

		// 滑块只用鼠标拖动；指针移出视口后事件的 target 是 <html>，移动与松开由 useDrag 在 document 上跟踪
		const drag = useDrag({
			selectable: false,
			start: handleClickThumb,
			move: (_, point) => handleMouseMoveDocument(point),
			end: handleMouseUpDocument
		});

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

		const setThumbMove = () => {
			if (!thumb.value) return;
			thumb.value.style[$.prefixStyle('transform').camel] = `translate${barOptions.value.axis}(${thumbMove.value}px)`;
		};

		const refreshThumb = () => raf(setThumbMove);

		const refreshThrottleThumb = throttle(refreshThumb, 10);

		// 悬停区域：优先 trigger（祖先或文档中的首个匹配），否则为轨道所在的容器
		let hoverEl: HTMLElement | null = null;
		const resolveHoverEl = () => {
			const el = instance?.vnode?.el as HTMLElement | undefined;
			if (!el) return null;
			if (props.trigger) {
				const target = el.closest?.(props.trigger) || document.querySelector(props.trigger);
				if (target) return target as HTMLElement;
			}
			return el.parentElement;
		};

		const bindHover = () => {
			hoverEl = resolveHoverEl();
			if (!hoverEl) return;
			$.on($.el(hoverEl), 'mousemove', handleMouseMove);
			$.on($.el(hoverEl), 'mouseleave', handleLeave);
		};

		const unbindHover = () => {
			if (!hoverEl) return;
			$.off($.el(hoverEl), 'mousemove', handleMouseMove);
			$.off($.el(hoverEl), 'mouseleave', handleLeave);
			hoverEl = null;
		};

		// 轨道被移到别的容器（Teleport 目标变化）或 trigger 变化后，悬停区域随之重新解析
		const refreshHover = () => {
			unbindHover();
			bindHover();
		};

		onMounted(bindHover);

		onBeforeUnmount(unbindHover);

		watch(() => props.trigger, refreshHover, { flush: 'post' });

		// 用throttle优化连续变化的transfrom
		watch(
			() => thumbMove.value,
			() => {
				if (!thumb.value) return;
				refreshThrottleThumb();
			},
			{ immediate: true }
		);

		// 可移动范围变化（如滚动后内容变少）时同步写入：滑块立即收回轨道内
		// sticky 轨道在滚动容器内，留在旧位置的滑块会撑大容器的 scrollHeight，随后 Scroller 测得的内容尺寸偏大、滚动条不消失（Firefox）
		watch(maxMove, setThumbMove, { flush: 'post' });

		expose({ scrollTo, target: track, refreshHover });

		return () => {
			return (
				<TransitionFade>
					<div
						v-show={thumbSize.value && (props.always || isVisible.value)}
						ref={track}
						class={[attrs.class, 'is-' + barOptions.value.key, 'vc-scroller-track']}
						// @ts-ignore
						style={attrs.style}
						onMousedown={handleClickTrack}
					>
						<div
							ref={thumb}
							class={[props.thumbClass, 'vc-scroller-track__thumb']}
							style={[props.thumbStyle!, thumbCalcStyle.value]}
							// 中右键也不冒泡到轨道
							onMousedown={withModifiers(drag.listeners.onMousedown, ['stop'])}
						/>
					</div>
				</TransitionFade>
			);
		};
	}
});
