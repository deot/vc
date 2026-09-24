/** @jsxImportSource vue */

import { defineComponent, onBeforeUnmount, onMounted } from 'vue';
import { Wheel } from '@deot/helper-wheel';
import { props as scrollerProps } from './scroller-props';
import { Bar } from './bar';
import { useScroller } from './use-scroller';

const COMPONENT_NAME = 'vc-scroller-wheel';

/**
 * 由wheel驱动滚动：滚动位置在rAF中写入，与依赖它的内容（如表头、虚拟列表）在同一帧更新
 * （Scroller由浏览器滚动，scroll事件晚于实际滚动，依赖它联动的内容会慢一拍）
 * 轨道是滚动容器的直接子元素，由 position: sticky 固定在可视区（Bar mode="sticky"），不依赖 JS 补偿位移
 *
 * 渲染原理（便于理解分层）
 * 渲染主线程：parse, style, layout, layer, paint；合成线程：tiling, raster, draw
 * 改变属性的reflow是异步的（可合并多个属性的改变），但读取几何信息（如clientWidth）会立即reflow
 * 设置scrollTop会经过渲染主线程；可合成滚动的容器只需合成线程重新draw，否则要重绘滚动内容
 *
 * 分层：非native时根节点常驻 will-change: transform（见scroller-wheel.scss），与原生滚动容器一样单独成层（开发者工具Layers面板可见）
 * overflow: hidden 的容器不可由用户滚动，浏览器未必为其做合成滚动，单独成层可把scrollTop变化带来的重绘限定在该层
 *
 * 不按 always / hover 切换 will-change：
 * 1. will-change: transform 会创建层叠上下文，并让 position: fixed 的后代以该容器为包含块，切换时这些后代的层叠与定位会跳变
 * 2. 每次切换都要新建/销毁合成层并重新光栅化整块内容，悬停往往紧接着滚轮，切换反而会在开始滚动时引入卡顿
 * 3. 分层服务于滚动，与滚动条是否可见无关；触摸设备没有hover，按hover切换会让触摸滚动失去分层
 * native时为 overflow: auto，由浏览器合成滚动，不需要 will-change（is-native 下为 unset）
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
			wrapperPadding,
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
								wrapperPadding={wrapperPadding.value}
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
