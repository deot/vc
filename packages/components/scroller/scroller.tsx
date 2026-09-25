/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { props as scrollerProps } from './scroller-props';
import { Bar } from './bar';
import { useScroller } from './use-scroller';
import { useWheel } from './use-wheel';

const COMPONENT_NAME = 'vc-scroller';

/**
 * 根节点即滚动容器，轨道由 position: sticky 固定在可视区（Bar mode="sticky"），不依赖 JS 补偿位移
 *
 * 两种驱动方式（wheel）
 * 1. 原生滚动（默认）：overflow: auto，键盘、触摸、聚焦、页内查找等都由浏览器处理，通用场景优先使用
 *    scroll事件晚于实际滚动，依赖它联动的内容（如表头、虚拟列表）会慢一拍
 * 2. 滚轮驱动（wheel 且非 native，见use-wheel）：滚动位置在rAF中写入，与依赖它的内容在同一帧更新
 *    overflow: hidden，键盘方向键、PageDown等无法滚动内容，触摸滚动为模拟实现
 *
 * 渲染原理（便于理解分层）
 * 渲染主线程：parse, style, layout, layer, paint；合成线程：tiling, raster, draw
 * 改变属性的reflow是异步的（可合并多个属性的改变），但读取几何信息（如clientWidth）会立即reflow
 * 设置scrollTop会经过渲染主线程；可合成滚动的容器只需合成线程重新draw，否则要重绘滚动内容
 *
 * 分层：滚轮驱动时根节点常驻 will-change: transform（见scroller.scss的is-wheel），与原生滚动容器一样单独成层（开发者工具Layers面板可见）
 * overflow: hidden 的容器不可由用户滚动，浏览器未必为其做合成滚动，单独成层可把scrollTop变化带来的重绘限定在该层
 *
 * 不按 always / hover 切换 will-change：
 * 1. will-change: transform 会创建层叠上下文，并让 position: fixed 的后代以该容器为包含块，切换时这些后代的层叠与定位会跳变
 * 2. 每次切换都要新建/销毁合成层并重新光栅化整块内容，悬停往往紧接着滚轮，切换反而会在开始滚动时引入卡顿
 * 3. 分层服务于滚动，与滚动条是否可见无关；触摸设备没有hover，按hover切换会让触摸滚动失去分层
 * 原生滚动由浏览器合成滚动，不需要 will-change
 */
export const Scroller = defineComponent({
	name: COMPONENT_NAME,
	props: scrollerProps,
	emits: ['scroll'],
	setup(props, { slots, expose }) {
		const Content = props.tag;
		const scroller = useScroller(expose);
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
			handleBarChange
		} = scroller;
		const { isWheel, handleNativeScroll } = useWheel(scroller);

		return () => {
			return (
				<div
					ref={wrapper}
					class={[wrapperClass.value, COMPONENT_NAME, { 'is-wheel': isWheel.value }]}
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
