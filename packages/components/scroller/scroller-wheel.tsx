/** @jsxImportSource vue */

import { defineComponent, onBeforeUnmount, onMounted } from 'vue';
import { Wheel } from '@deot/helper-wheel';
import { props as scrollerProps } from './scroller-props';
import { Bar } from './bar';
import { useScroller } from './use-scroller';

const COMPONENT_NAME = 'vc-scroller-wheel';

/**
 * 为减少一层嵌套，为去除滚动bar的抖动，使用wheel模拟
 * 同时考虑分层（开发者工具打开layers, 需要加上will-change和原生保持一致的分层, TODO: always或hover时设置will-change）
 *
 * 以下需要了解浏览器的渲染原理
 * 渲染主线程：parse, style, layout, layer, paint
 * 合成线程：tiling, raster, draw
 *
 * 原生scroll事件：不会触发reflow和repaint
 * 原生wheel事件设置scrollTop：不会触发reflow和repaint
 * 以上只会影响合成线程的draw，此阶段由GPU完成
 * 改变属性的的reflow是异步的（这样可以合并多个属性的改变），但获取几何信息（如clientWidth）会立即reflow, 然后再执行后续的
 *
 * reflow和repaint发生在渲染主线程，不过设置scrollTop会经过渲染主线程
 *
 * 做抖动优化：
 * 使用scroll原生时，bar(可以没有),thumb都会出现抖动，这里选择用wheel代替解决该问题;
 * 设置scrollTop不会reflow和repaint，不需要考虑transfrom来改变content（transform也只在draw完成）
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
			scrollX,
			scrollY,
			wrapperW,
			wrapperH,
			contentH,
			contentW,
			scrollTo,
			handleBarChange
		} = useScroller(expose);

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
						(props.showBar && wrapper.value && content.value) && (
							<Bar
								ref={bar}
								fit={true}
								wrapperW={wrapperW.value}
								wrapperH={wrapperH.value}
								contentW={contentW.value}
								contentH={contentH.value}
								scrollX={scrollX.value}
								scrollY={scrollY.value}
								native={props.native}
								to={props.barTo}
								always={props.always}
								thumbMinSize={props.thumbMinSize}
								thumbStyle={props.thumbStyle}
								thumbClassName={props.thumbClassName}
								trackOffsetX={props.trackOffsetX}
								trackOffsetY={props.trackOffsetY}
								onChange={handleBarChange}
							/>
						)
					}
				</div>
			);
		};
	}
});
