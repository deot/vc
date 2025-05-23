/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { props as scrollerProps } from './scroller-props';
import { Bar } from './bar';
import { useScroller } from './use-scroller';

const COMPONENT_NAME = 'vc-scroller';

/**
 * 作为备选方案,目前推荐使用ScrollerWheel
 * 使用原生的滚动（overflow: auto）实现滚动
 *
 * 比scroller-wheel存在两个问题
 * 1. scroll效益比wheel高，导致scroll触发的事件操作scroll*和原生的一定延迟
 * 2. 增加了一层嵌套
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
			handleBarChange,
			handleScroll
		} = useScroller(expose);
		return () => {
			return (
				<div class="vc-scroller">
					<div
						ref={wrapper}
						style={wrapperStyle.value}
						class={wrapperClass.value}
						onScroll={handleScroll}
					>
						<Content
							ref={content}
							// @ts-ignore
							style={props.contentStyle}
							class={props.contentClass}
						>
							{ slots.default?.() }
						</Content>
					</div>
					{
						(wrapper.value && content.value) && (
							<Bar
								ref={bar}
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
								thumbClass={props.thumbClass}
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
