/** @jsxImportSource vue */

import { getCurrentInstance, computed, defineComponent, nextTick, onBeforeUnmount, onMounted, provide, ref, watch, Teleport } from 'vue';
import { Resize } from '@deot/helper-resize';
import { props as scrollerProps } from './scroller-props';
import { Bar } from './bar';
import type { BarExposed } from './bar';

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
	setup(props, { emit, slots, expose }) {
		const instance = getCurrentInstance();
		const barDisabled = ref(true);

		const wrapperW = ref(0);
		const wrapperH = ref(0);

		const contentH = ref(0);
		const contentW = ref(0);

		const wrapper = ref<HTMLElement>();
		const content = ref<HTMLElement>();

		const barX = ref<BarExposed>();
		const barY = ref<BarExposed>();

		const calcWrapperStyle = computed(() => {
			let style = {} as Record<string, string>;
			if (props.height) {
				style.height = typeof props.height !== 'number' ? props.height : `${props.height}px`;
			}
			
			if (props.maxHeight) {
				style.maxHeight = typeof props.maxHeight !== 'number' ? props.maxHeight : `${props.maxHeight}px`;
			}
			return style;
		});

		const barBinds = computed(() => {
			return {
				always: props.always,
				thumbMinSize: props.thumbMinSize,
				thumbStyle: props.thumbStyle,
				trackStyle: props.trackStyle
			};
		});

		// 记录当前容器(wrapper)和内容(content)宽高
		const refreshSize = () => {
			if (!wrapper.value) return;

			wrapperW.value = wrapper.value.clientWidth;
			wrapperH.value = wrapper.value.clientHeight;

			contentH.value = wrapper.value.scrollHeight;
			contentW.value = wrapper.value.scrollWidth;
		};

		const refreshScroll = () => {
			if (!barY.value || !barX.value) return;
			const { scrollTop } = wrapper.value!;
			const { scrollLeft } = wrapper.value!;

			// 取代当前组件内值变化，避免构建当前组件的虚拟Dom掉帧（解决表格数据多时问题）
			barY.value.scrollTo(scrollTop);
			barX.value.scrollTo(scrollLeft);
		};

		// TODO: 如遇性能问题，增加节流函数
		const refresh = () => {
			refreshSize();
			refreshScroll();
		};

		// 用scroll导致bar的抖动，后期可以考虑多嵌套一层
		const handleScroll = (e: UIEvent) => {
			emit('scroll', e);
			refreshScroll();
		};

		// 这个会主动触发scroll事件
		const setScrollTop = (value: number) => {
			wrapper.value!.scrollTop = value;
		};

		// 这个会主动触发scroll事件
		const setScrollLeft = (value: number) => {
			wrapper.value!.scrollLeft = value;
		};

		const setBarStatus = () => {
			if (typeof document !== 'undefined' && props.barTo) {
				barDisabled.value = !document.querySelector(props.barTo);
			}
		};

		onMounted(() => {
			if (!props.native) {
				nextTick(refresh);
				nextTick(setBarStatus);
			}
			if (props.autoResize) {
				Resize.on(wrapper.value!, refresh);
				Resize.on(content.value!, refresh);
			}
		});

		onBeforeUnmount(() => {
			if (props.autoResize) {
				Resize.off(wrapper.value!, refresh);
				Resize.off(content.value!, refresh);
			}
		});

		provide('scroller', {
			props,
			wrapper,
			content,
			getCursorContainer: () => {
				return (props.barTo && document.querySelector(props.barTo)) || instance?.vnode?.el;
			}
		});

		watch(
			() => props.barTo,
			setBarStatus
		);

		expose({
			setScrollTop,
			setScrollLeft
		});
		const Content = props.tag;
		return () => {
			return (
				<div class="vc-scroller">
					<div 
						ref={wrapper} 
						style={[props.wrapperStyle, calcWrapperStyle.value]} 
						class={[
							props.wrapperClassName,
							props.native ? 'is-native' : 'is-hidden',
							'vc-scroller__wrapper'
						]}
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
					</div>
					{
						!props.native && (!barDisabled.value || !props.barTo) && (
							<Teleport to={props.barTo} disabled={!props.barTo}>
								<Bar 
									ref={barX}
									{
										...barBinds.value
									}
									track-offset={[props.trackOffsetX[3], props.trackOffsetX[1]]}
									wrapper-size={wrapperW.value} 
									content-size={contentW.value} 
									style={{
										left: props.trackOffsetX[3] + 'px',
										bottom: props.trackOffsetX[2] + 'px'
									}}
									// @ts-ignore
									onRefreshScroll={setScrollLeft}
								/>
								<Bar
									ref={barY}
									{
										...barBinds.value
									}
									track-offset={[props.trackOffsetY[0], props.trackOffsetY[2]]}
									wrapper-size={wrapperH.value} 
									content-size={wrapperH.value} 
									style={{ 
										top: props.trackOffsetY[0] + 'px', 
										right: props.trackOffsetY[1] + 'px'
									}}
									vertical
									// @ts-ignore
									onRefreshScroll={setScrollTop}
								/>
							</Teleport>
						)
					}
					
				</div>
			);
		};
	}
});
