/** @jsxImportSource vue */

import { getCurrentInstance, computed, defineComponent, nextTick, onBeforeUnmount, onMounted, provide, ref, Teleport } from 'vue';
import { Resize } from '@deot/helper-resize';
import { Wheel } from '@deot/helper-wheel';
import * as $ from '@deot/helper-dom';

import { props as scrollerProps } from './scroller-props';
import { Bar } from './bar';
import type { BarExposed } from './bar';

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
	setup(props, { emit, slots, expose }) {
		const instance = getCurrentInstance()!;
		const barDisabled = ref(true);
		const wrapperW = ref(0);
		const wrapperH = ref(0);

		const contentH = ref(0);
		const contentW = ref(0);

		const scrollX = ref(0);
		const scrollY = ref(0);

		const wrapper = ref<HTMLElement>();
		const content = ref<HTMLElement>();

		const barX = ref<BarExposed>();
		const barY = ref<BarExposed>();

		const barBinds = computed(() => {
			return {
				always: props.always,
				thumbMinSize: props.thumbMinSize,
				thumbStyle: props.thumbStyle,
				trackStyle: props.trackStyle
			};
		});

		const barPos = computed(() => {
			const maxMoveX = contentW.value - wrapperW.value;
			const maxMoveY = contentH.value - wrapperH.value;

			const fitMoveX = scrollX.value >= maxMoveX ? maxMoveX : scrollX.value;
			const fitMoveY = scrollY.value >= maxMoveY ? maxMoveY : scrollY.value;

			return `translate(${fitMoveX}px, ${fitMoveY}px)`;
		});

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

		// 记录当前容器(wrapper)和内容(content)宽高
		const refreshSize = () => {
			if (!wrapper.value) return;

			wrapperW.value = wrapper.value.clientWidth;
			wrapperH.value = wrapper.value.clientHeight;

			contentH.value = wrapper.value.scrollHeight;
			contentW.value = wrapper.value.scrollWidth;
		};

		// 记录当前容器(wrapper)滚动的位移
		const refreshScroll = () => {
			if (!barY.value || !barX.value) return;

			scrollY.value = wrapper.value!.scrollTop;
			scrollX.value = wrapper.value!.scrollLeft;

			let barParentEl = document.querySelector(props.barTo!);
			if (!barParentEl || barParentEl === instance.vnode.el) {
				let key = $.prefixStyle('transform').camel;
				barY.value.track!.style[key] = barPos.value;
				barX.value.track!.style[key] = barPos.value;
			}
			// 取代当前组件内值变化，避免构建当前组件的虚拟Dom掉帧（解决表格数据多时问题）
			barY.value.scrollTo(scrollY.value);
			barX.value.scrollTo(scrollX.value);

			emit('scroll', { target: wrapper.value });
		};

		// TODO: 如遇性能问题，增加节流函数
		const refresh = () => {
			refreshSize();
			refreshScroll();
		};
		const handleWheel = (deltaX: number, deltaY: number) => {
			const el = wrapper.value!; // wrapper
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

			refreshScroll();
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

		const setScrollTop = (value: number) => {
			wrapper.value!.scrollTop = value;
			refreshScroll();
		};

		const setScrollLeft = (value: number) => {
			wrapper.value!.scrollLeft = value;
			refreshScroll();
		};

		const setBarStatus = () => {
			if (typeof document !== 'undefined' && props.barTo) {
				barDisabled.value = !document.querySelector(props.barTo);
			}
		};

		const handleNativeScroll = (e: UIEvent) => {
			if (props.native) {
				emit('scroll', e);
			}
		};

		let wheel: Wheel;
		onMounted(() => {
			if (!props.native) {
				nextTick(refresh);
				nextTick(setBarStatus);
			}
			if (props.autoResize) {
				Resize.on(wrapper.value!, refresh);
				Resize.on(content.value!, refresh);
			}

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
			if (props.autoResize) {
				Resize.off(wrapper.value!, refresh);
				Resize.off(content.value!, refresh);
			}

			wheel.off(handleWheel);
		});

		provide('scroller', {
			props,
			wrapper,
			content,
			getCursorContainer: () => {
				return (props.barTo && document.querySelector(props.barTo)) || instance?.vnode?.el;
			}
		});

		expose({
			setScrollTop,
			setScrollLeft
		});
		const Content = props.tag;
		return () => {
			return (
				<div 
					class="vc-scroller-wheel" 
					ref={wrapper} 
				>
					<div 
						
						style={[props.wrapperStyle, calcWrapperStyle.value]} 
						class={[
							props.wrapperClassName,
							props.native ? 'is-native' : 'is-hidden',
							'vc-scroller-wheel vc-scroller__wrapper'
						]}
						onScroll={handleNativeScroll}
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
									content-size={contentH.value} 
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
