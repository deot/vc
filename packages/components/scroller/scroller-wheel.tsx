/** @jsxImportSource vue */

import { defineComponent, onBeforeUnmount, onMounted } from 'vue';
import { Wheel } from '@deot/helper-wheel';
import { props as scrollerProps } from './scroller-props';
import { Bar } from './bar';
import { useScroller } from './use-scroller';

const COMPONENT_NAME = 'vc-scroller-wheel';

/**
 * 为减少一层嵌套，使用wheel驱动滚动，让滚动位置与依赖它的内容（如表头、虚拟列表）在同一帧更新
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
 * 轨道是滚动容器的直接子元素，由 position: sticky 固定在可视区（Bar mode="sticky"），不依赖 JS 补偿位移;
 * 设置scrollTop不会reflow和repaint，不需要考虑transfrom来改变content（transform也只在draw完成）
 */
export const ScrollerWheel = defineComponent({
	name: COMPONENT_NAME,
	props: Object.assign({}, scrollerProps, {
		stopPropagation: {
			type: Boolean,
			default: true
		}
	}),
	emits: ['scroll'],
	setup(props, { slots, expose }) {
		const Content = props.tag;
		const {
			bar,
			wrapper,
			content,
			wrapperStyle,
			wrapperClass,
			scrollX,
			scrollY,
			wrapperW,
			wrapperH,
			contentH,
			contentW,
			scrollTo,
			handleBarChange,
			handleScroll
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
					shouldWheelY,
					stopPropagation: () => {
						return props.stopPropagation;
					}
				}
			);

			wheel.on(handleWheel);
		});

		onBeforeUnmount(() => {
			wheel.off(handleWheel);
		});

		/**
		 * 非wheel引起的滚动（聚焦、scrollIntoView、页内查找、直接写scrollTop等）也要同步位置，否则下次wheel会从旧位置跳回
		 * 自身scrollTo写入后触发的scroll与记录值一致，跳过以免重复派发（容差1px兼容小数像素取整）
		 */
		const handleNativeScroll = () => {
			const el = wrapper.value!;
			if (
				!props.native
				&& Math.abs(el.scrollTop - scrollY.value) < 1
				&& Math.abs(el.scrollLeft - scrollX.value) < 1
			) return;

			handleScroll();
		};

		return () => {
			return (
				<div
					ref={wrapper}
					class={[wrapperClass.value, 'vc-scroller-wheel']}
					style={wrapperStyle.value}
					onScroll={handleNativeScroll}
				>
					<Content
						ref={content}
						// @ts-ignore
						style={props.contentStyle}
						class={[props.contentClass, 'vc-scroller__content']}
					>
						{ slots.default?.() }
					</Content>
					{
						(props.showBar && wrapper.value && content.value) && (
							<Bar
								ref={bar}
								mode="sticky"
								wrapperW={wrapperW.value}
								wrapperH={wrapperH.value}
								contentW={contentW.value}
								contentH={contentH.value}
								scrollX={scrollX.value}
								scrollY={scrollY.value}
								native={props.native}
								to={props.barTo}
								trigger={props.barTrigger}
								always={props.always}
								thumbMinSize={props.thumbMinSize}
								thumbStyle={props.thumbStyle}
								thumbClass={props.thumbClass}
								trackStyle={props.trackStyle}
								trackClass={props.trackClass}
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
