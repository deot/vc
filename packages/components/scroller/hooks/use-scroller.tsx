/** @jsxImportSource vue */

import { computed, onBeforeUnmount, onMounted, ref, provide, reactive, nextTick, watch } from 'vue';
import { Resize } from '@deot/helper-resize';
import { scrollIntoView } from '@deot/helper-dom';
import { toPx, toRem } from '@deot/vc-shared';
import { getPadding } from '../utils';
import { ScrollerManager } from '../core/manager';
import { Bar } from '../scroller-bar/bar';
import { useWheel } from './use-wheel';
import type { SetupContext } from 'vue';
import type { BarExposed } from '../scroller-bar/bar';
import type { Props } from '../scroller-props';
import type { ScrollerScrollToOptions } from '../types';

export type ScrollerOptions = {
	// 移动端（MScroller）：根节点加标记类 vcm-scroller，数字 height / maxHeight 为 750 稿长度，未设置 always 时始终使用原生滚动条
	mobile?: boolean;
};

/**
 * 滚动容器的状态：尺寸、位置、滚动条联动与对外暴露的实例
 * @param props ~
 * @param context ~
 * @param options ~
 * @param options.mobile 见 ScrollerOptions
 * @returns 状态与方法，供渲染与 useWheel 使用
 */
export const useScrollerState = (props: Props, context: SetupContext<['scroll']>, { mobile }: ScrollerOptions = {}) => {
	const { emit, expose } = context;
	const toLength = mobile ? toRem : toPx;

	const bar = ref<BarExposed>();
	const wrapper = ref<HTMLElement>();
	const content = ref<HTMLElement>();

	const scrollX = ref(0);
	const scrollY = ref(0);
	const wrapperW = ref(0);
	const wrapperH = ref(0);
	const contentH = ref(0);
	const contentW = ref(0);
	// [上, 右, 下, 左]；sticky 轨道需要抵消滚动容器的 padding，见 Bar
	const wrapperPadding = ref([0, 0, 0, 0]);

	const wrapperStyle = computed(() => {
		const style = {} as Record<string, string>;

		if (props.height) {
			style.height = toLength(props.height);
		}
		if (props.maxHeight) {
			style.maxHeight = toLength(props.maxHeight);
		}

		return [props.wrapperStyle, style];
	});

	// 是否使用原生滚动条：always（常显）只有自绘滚动条能做到，设置后不再使用原生滚动条
	// 移动端没有悬停，自绘滚动条只有常显一种形态：未设置 always 时始终使用原生滚动条（native=false 不生效）
	const isNative = computed(() => (mobile || props.native) && !props.always);

	const wrapperClass = computed(() => {
		return [
			props.wrapperClass,
			isNative.value ? 'is-native' : 'is-hidden'
		];
	});

	const refreshSize = async () => {
		if (!wrapper.value) return;

		const padding = getPadding(wrapper.value);
		padding.join() !== wrapperPadding.value.join() && (wrapperPadding.value = padding);

		// 实际测试中发现，不使用nextTick会存在contentW和contentH为上一次值的情况
		// 可视尺寸与内容尺寸在同一时刻读取：分开读取时，依赖两者之差的判断（如是否溢出）会拿到不一致的一对值
		await nextTick();
		if (!wrapper.value) return;
		wrapperW.value = wrapper.value.clientWidth;
		wrapperH.value = wrapper.value.clientHeight;
		contentH.value = wrapper.value.scrollHeight;
		contentW.value = wrapper.value.scrollWidth;
	};

	const refreshPosition = (options?: any) => {
		if (options) {
			scrollY.value = options.y ?? scrollY.value;
			scrollX.value = options.x ?? scrollX.value;
		} else {
			scrollY.value = wrapper.value!.scrollTop;
			scrollX.value = wrapper.value!.scrollLeft;
		}

		bar.value?.scrollTo?.(options || {
			x: scrollX.value,
			y: scrollY.value
		});
	};

	const refresh = async (options?: any) => {
		await refreshSize();
		refreshPosition(options);
	};

	const listeners: any[] = [];
	// 主动触发
	const triggerScrollDelegate = (options?: any) => {
		const delegates = {
			scrollLeft: (options && options.x) ?? scrollX.value,
			scrollTop: (options && options.y) ?? scrollY.value,
			clientWidth: wrapperW.value,
			clientHeight: wrapperH.value,
			scrollWidth: contentW.value,
			scrollHeight: contentH.value,
			getBoundingClientRect: () => wrapper.value?.getBoundingClientRect()
		};
		const e = {
			target: delegates,
			currentTarget: delegates
		};

		emit('scroll', e);
		listeners.forEach(listener => listener(e));
	};

	// 进行中的平滑滚动；新的 scrollTo（含滚轮、拖动滚动条）与卸载时取消
	let motion: AbortController | undefined;
	const stopMotion = () => {
		motion?.abort();
		motion = undefined;
	};

	/**
	 * 平滑滚动：逐帧写入滚动位置，由 scroll 事件同步状态与滚动条
	 * @param options 目标位置与时长
	 */
	const animateTo = (options: ScrollerScrollToOptions) => {
		const el = wrapper.value!;
		motion = new AbortController();
		(['x', 'y'] as const).forEach((axis) => {
			if (typeof options[axis] === 'undefined') return;
			const [position, scroll, client] = axis === 'x'
				? ['scrollLeft', 'scrollWidth', 'clientWidth'] as const
				: ['scrollTop', 'scrollHeight', 'clientHeight'] as const;
			// 有可滚动范围时限制在范围内，免得动画后段停在边界上空转；尚未量到尺寸时交给浏览器限制
			const max = el[scroll] - el[client];
			const to = max > 0 ? Math.min(Math.max(0, options[axis]!), max) : options[axis]!;
			scrollIntoView(el, { axis, from: el[position], to, duration: options.duration, signal: motion!.signal });
		});
	};

	const scrollTo = (options?: ScrollerScrollToOptions) => {
		stopMotion();
		if (options?.duration && options.duration > 0 && wrapper.value) {
			animateTo(options);
			return;
		}

		refreshPosition(options);

		if (options && typeof options.x !== 'undefined') {
			wrapper.value!.scrollLeft = options.x;
		}

		if (options && typeof options.y !== 'undefined') {
			wrapper.value!.scrollTop = options.y;
		};

		triggerScrollDelegate(options);
	};

	const handleScroll = () => {
		refreshPosition();

		triggerScrollDelegate();
	};

	onMounted(() => {
		if (props.autoResize) {
			Resize.on(wrapper.value!, refresh);
			Resize.on(content.value!, refresh);
		}
	});

	onBeforeUnmount(() => {
		stopMotion();
		if (props.autoResize) {
			Resize.off(wrapper.value!, refresh);
			Resize.off(content.value!, refresh);
		}

		listeners.splice(0, listeners.length);
	});

	const exposed = {
		wrapper,
		content,
		scrollTo,
		refresh,
		scrollLeft: scrollX,
		scrollTop: scrollY,
		clientWidth: wrapperW,
		clientHeight: wrapperH,
		scrollHeight: contentH,
		scrollWidth: contentW,
		setScrollTop: (value: number) => {
			scrollTo({ y: value });
		},
		setScrollLeft: (value: number) => {
			scrollTo({ x: value });
		},
		on: (listener: any) => {
			listeners.push(listener);
		},
		off: (listener: any) => {
			// 未注册的监听器（indexOf 为 -1）不能误删最后一个
			const index = listeners.indexOf(listener);
			index !== -1 && listeners.splice(index, 1);
		}
	};
	// 根节点登记实例，见 ScrollerManager
	// 在根节点的 ref 赋值时同步登记：早于所有 onMounted（含子组件，如外部滚动的 RecycleList 挂载时即查找承载者）；卸载时侦听器停止即移除
	watch(wrapper, (el, _, onCleanup) => {
		if (!el) return;
		ScrollerManager.add(el, exposed);
		onCleanup(() => ScrollerManager.remove(el));
	}, { flush: 'sync' });

	// 以下两个暴露scroll事件, 从而触发handleScroll
	expose(exposed);
	// reactive: xxx.scrollLeft.value -> xxx.scrollLeft
	const state = reactive(exposed);
	provide('vc-scroller', state);

	return {
		bar,
		wrapper,
		content,
		wrapperStyle,
		wrapperClass,
		isNative,
		scrollTo,

		scrollX,
		scrollY,
		wrapperW,
		wrapperH,
		contentH,
		contentW,
		wrapperPadding,

		state,
		handleScroll,
		handleBarChange: scrollTo,

		refreshPosition
	};
};

const COMPONENT_NAME = 'vc-scroller';

/**
 * Scroller / MScroller 共用的 setup，说明见 scroller.tsx
 * @param props ~
 * @param context ~
 * @param options ~
 * @returns render
 */
export const useScroller = (props: Props, context: SetupContext<['scroll']>, options: ScrollerOptions = {}) => {
	const { slots } = context;
	const name = options.mobile ? `${COMPONENT_NAME} vcm-scroller` : COMPONENT_NAME;
	const Content = props.tag;
	const scroller = useScrollerState(props, context, options);
	const {
		bar,
		wrapper,
		content,
		wrapperStyle,
		wrapperClass,
		isNative,
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
				class={[wrapperClass.value, name, { 'is-wheel': isWheel.value, [`is-${props.axis}`]: !!props.axis }]}
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
					(props.showBar && !isNative.value && wrapper.value && content.value) && (
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
							native={false}
							to={props.barTo}
							trigger={props.barTriggerElement}
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
};
