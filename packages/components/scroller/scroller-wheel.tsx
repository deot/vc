/** @jsxImportSource vue */

import { computed, defineComponent, onBeforeUnmount, onMounted, ref } from 'vue';
import { Wheel } from '@deot/helper-wheel';
import * as $ from '@deot/helper-dom';
import { props as scrollerProps } from './scroller-props';
import { Bar } from './bar';
import { useScroller } from './use-scroller';

const COMPONENT_NAME = 'vc-scroller-wheel';

/**
 * 为减少一层嵌套，为去除滚动bar的抖动，使用wheel模拟
 * 原生scroll事件：不会触发重排和重绘
 * 原生wheel事件设置scrollTop：不会触发重排和重绘
 * 做抖动优化：
 * 使用scroll原生时，bar(可以没有),thumb都会出现抖动，这里选择用wheel代替解决该问题;
 * 测试时设置scrollTop没有重排重绘，暂不考虑改用transfrom来改变content
 */
export const ScrollerWheel = defineComponent({
	name: COMPONENT_NAME,
	props: scrollerProps,
	emits: ['scroll'],
	setup(props, { slots, expose }) {
		const Content = props.tag;
		const {
			bar,
			wrapper,
			content,
			wrapperStyle,
			wrapperClassName,
			handleScroll
		} = useScroller(expose);

		const scrollX = ref(0);
		const scrollY = ref(0);

		const wrapperW = ref(0);
		const wrapperH = ref(0);

		const contentH = ref(0);
		const contentW = ref(0);

		const barPos = computed(() => {
			const maxMoveX = contentW.value - wrapperW.value;
			const maxMoveY = contentH.value - wrapperH.value;

			const fitMoveX = scrollX.value >= maxMoveX ? maxMoveX : scrollX.value;
			const fitMoveY = scrollY.value >= maxMoveY ? maxMoveY : scrollY.value;

			return `translate(${fitMoveX}px, ${fitMoveY}px)`;
		});

		const handleRefreshSize = (it: any) => {
			wrapperW.value = it.wrapperW;
			wrapperH.value = it.wrapperH;

			contentH.value = it.contentH;
			contentW.value = it.contentW;
		};

		const handleRefreshTrack = (it: any) => {
			scrollY.value = it.scrollTop;
			scrollX.value = it.scrollLeft;

			if (!props.barTo) {
				const key = $.prefixStyle('transform').camel;
				bar.value!.trackY.target!.style[key] = barPos.value;
				bar.value!.trackX.target!.style[key] = barPos.value;
			}
		};

		const handleWheel = (deltaX: number, deltaY: number) => {
			const el = wrapper.value!;
			if (
				Math.abs(deltaY) > Math.abs(deltaX)
				&& contentH.value > wrapperH.value
			) {
				el.scrollTop = Math.min(
					Math.max(0, scrollY.value + deltaY),
					contentH.value - wrapperH.value
				);
			} else if (deltaX && contentW.value > wrapperW.value) {
				el.scrollLeft = Math.min(
					Math.max(0, scrollX.value + deltaX),
					contentW.value - wrapperW.value
				);
			}

			bar.value!.refreshTrack();
		};

		// X轴是否允许滚动
		const shouldWheelX = (delta: number) => {
			if (props.native || wrapperW.value === contentW.value) {
				return false;
			}

			delta = Math.round(delta);
			if (delta === 0) {
				return false;
			}

			return (
				(delta < 0 && scrollX.value > 0)
				|| (delta >= 0 && scrollX.value < contentW.value - wrapperW.value)
			);
		};

		// Y轴是否允许滚动
		const shouldWheelY = (delta: number) => {
			if (props.native || wrapperH.value === contentH.value) {
				return false;
			}

			delta = Math.round(delta);
			if (delta === 0) {
				return false;
			}

			return (
				(delta < 0 && scrollY.value > 0)
				|| (delta >= 0 && scrollY.value < contentH.value - wrapperH.value)
			);
		};

		let wheel: Wheel;
		onMounted(() => {
			wheel = new Wheel(
				wrapper.value!,
				{
					shouldWheelX,
					shouldWheelY
				}
			);

			wheel.on(handleWheel);
		});

		onBeforeUnmount(() => {
			wheel.off(handleWheel);
		});

		return () => {
			return (
				<div
					ref={wrapper}
					class={[wrapperClassName.value, 'vc-scroller-wheel']}
					style={wrapperStyle.value}
					onScroll={handleScroll}
				>
					<Content
						ref={content}
						// @ts-ignore
						style={props.contentStyle}
						class="vc-scroller__content"
					>
						{ slots.default?.() }
					</Content>
					{
						(wrapper.value && content.value) && (
							<Bar
								ref={bar}
								wrapper={wrapper.value}
								content={content.value}
								native={props.native}
								to={props.barTo}
								always={props.always}
								thumbMinSize={props.thumbMinSize}
								thumbStyle={props.thumbStyle}
								thumbClassName={props.thumbClassName}
								trackOffsetX={props.trackOffsetX}
								trackOffsetY={props.trackOffsetY}
								// @ts-ignore
								onRefreshSize={handleRefreshSize}
								onRefreshTrack={handleRefreshTrack}
							/>
						)
					}
				</div>
			);
		};
	}
});
