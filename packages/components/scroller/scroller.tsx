/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { props as scrollerProps } from './scroller-props';
import { Bar } from './bar';
import { useScroller } from './use-scroller';

const COMPONENT_NAME = 'vc-scroller';

/**
 * 通用场景优先使用
 * 使用原生的滚动（overflow: auto）实现滚动，键盘、触摸、聚焦、页内查找等都由浏览器处理
 * 根节点即滚动容器，轨道由 position: sticky 固定在可视区（Bar mode="sticky"），与ScrollerWheel结构一致
 *
 * 比scroller-wheel存在的问题
 * scroll事件晚于实际滚动，依赖scroll事件联动的内容（如表头、虚拟列表）会慢一拍，这类场景使用ScrollerWheel
 */
export const Scroller = defineComponent({
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
			wrapperClass,
			scrollX,
			scrollY,
			wrapperW,
			wrapperH,
			contentH,
			contentW,
			wrapperPadding,
			handleBarChange,
			handleScroll
		} = useScroller(expose);
		return () => {
			return (
				<div
					ref={wrapper}
					class={[wrapperClass.value, 'vc-scroller']}
					style={wrapperStyle.value}
					onScroll={handleScroll}
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

								// @ts-ignore
								onChange={handleBarChange}
							/>
						)
					}
				</div>
			);
		};
	}
});
