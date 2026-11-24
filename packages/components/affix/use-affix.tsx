/** @jsxImportSource vue */

import { ref, reactive, shallowRef, computed, watch, onMounted, onBeforeUnmount, provide, nextTick } from 'vue';
import type { SetupContext } from 'vue';
import { Resize } from '@deot/helper-resize';
import { getViewportRect } from '../scroller/utils';
import { ScrollerManager } from '../scroller/core/manager';
import type { Props } from './affix-props';
import { toPx, toRem } from '@deot/vc-shared';

const SHARED = { shared: true };

/**
 * Affix / MAffix 共用的吸附逻辑与渲染
 * offset 写进样式（CSS 负责定位）；判断吸附用的 px 由宽度为 offset 的测量节点给出，两端一致
 * @param props ~
 * @param context ~
 * @param context.slots ~
 * @param context.expose ~
 * @param options ~
 * @param options.mobile 移动端（MAffix）：根节点加标记类 vcm-affix，数字 offset 为 750 稿长度，随 --vc-rem 缩放；字符串原样作为 CSS 长度
 * @returns render
 */
export const useAffix = (
	props: Props,
	context: SetupContext<['update:modelValue']>,
	options: { mobile?: boolean } = {}
) => {
	const { slots, expose, emit } = context;
	const name = options.mobile ? 'vc-affix vcm-affix' : 'vc-affix';
	const toLength = options.mobile ? toRem : toPx;

	const current = shallowRef<HTMLDivElement>(); // 当前元素（外层）：宽度由布局决定，吸附时只写占位高度
	const content = shallowRef<HTMLDivElement>(); // 固定层：高度由内容撑开，吸附时只写宽度
	const measurer = shallowRef<HTMLDivElement>(); // 宽度为 offset 的测量节点：--vc-rem、CSS 变量等变化时尺寸随之变化

	let scroller: HTMLElement | Window | undefined; // 当前元素所在的滚动容器（最近一层，可能为 window），吸附位置以它为参照；挂载时查找
	let base: HTMLElement | undefined; // props.target 指向的容器，固钉始终保持在其中；挂载时查找

	// 外层的视口位置只在滚动回调里读，尺寸写进样式（吸附时的占位高度、固定层宽度）
	let currentTop = 0;
	let currentBottom = 0;
	const currentSize = reactive({
		width: 0,
		height: 0
	});

	const isActive = ref(false);
	const transformY = ref(0);

	// 样式中的 offset：数字按平台换算（px / 750 稿），字符串原样
	const offsetLength = computed(() => toLength(props.offset));

	// 测量节点的宽度：宽度不能为负，数字取绝对值，读出后再带上符号
	const measurerStyle = computed(() => {
		const { offset } = props;
		return { width: toLength(typeof offset === 'string' ? offset : Math.abs(offset)) };
	});

	/**
	 * 判断吸附用的 offset（CSS px）：滚动时只读缓存；
	 * 读测量节点的计算宽度（不受祖先缩放影响），节点尺寸变化（--vc-rem、CSS 变量因视口、主题或局部覆盖而变化）时重新读取
	 */
	let offsetPx = 0;
	const measureOffset = () => {
		const { offset } = props;
		const width = (measurer.value && parseFloat(window.getComputedStyle(measurer.value).width)) || 0;
		offsetPx = typeof offset === 'number' && offset < 0 ? -width : width;
	};

	// 吸附线：sticky 时写在外层，fixed 吸附时写在固定层
	const edgeStyle = computed(() => ({
		[props.placement]: offsetLength.value,
		zIndex: props.zIndex
	}));

	// fixed=false：由 position: sticky 固定在滚动容器内，吸附位置不依赖 JS，滚动时不会抖动
	const currentStyle = computed(() => {
		if (!props.fixed) return edgeStyle.value;
		if (!isActive.value) return {};
		return {
			height: `${currentSize.height}px`
		};
	});

	const contentStyle = computed(() => {
		if (!props.fixed || !isActive.value) return {};
		return {
			...edgeStyle.value,
			width: `${currentSize.width}px`,
			transform: transformY.value ? `translateY(${transformY.value}px)` : ''
		};
	});

	/**
	 * fixed：宽度与位置取外层，高度取固定层，都不量自己写上的值，吸附期间容器或内容变化也能跟上；
	 * bottom 按内容高度推算，外层的占位高度可能还是上一次的值
	 * sticky：不写尺寸，外层即内容
	 */
	const setCurrentRect = () => {
		const rect = current.value?.getBoundingClientRect?.();
		if (!rect) return;
		const height = props.fixed
			? content.value?.getBoundingClientRect?.().height ?? rect.height
			: rect.height;
		currentTop = rect.top;
		currentBottom = rect.top + height;
		currentSize.width = rect.width;
		currentSize.height = height;
	};

	// sticky 以滚动容器去掉边框与 padding 后的可视区为参照；恰好停在吸附线上即为吸附中（被父元素带走后不再算）
	// offset 为 CSS px，祖先有缩放时按 scale 换算为视口 px
	const setStickyStatus = () => {
		if (!scroller) return;
		const { top, bottom, scale } = getViewportRect(scroller);

		isActive.value = props.placement === 'bottom'
			? Math.abs(bottom - offsetPx * scale - currentBottom) < 1
			: Math.abs(currentTop - top - offsetPx * scale) < 1;
	};

	// fixed：以视口为参照（窗口高度每次实时读取）；有 target 时，target 离开视口后不再吸附，靠近其边缘时把固钉推出
	const setFixedStatus = () => {
		const isTop = props.placement === 'top';
		const windowHeight = window.innerHeight;
		isActive.value = isTop ? offsetPx > currentTop : windowHeight - offsetPx < currentBottom;
		if (!props.target) return;

		const container = base!.getBoundingClientRect();
		const room = offsetPx + currentSize.height;
		isActive.value &&= isTop ? container.bottom > 0 : windowHeight > container.top;
		transformY.value = isTop
			? Math.min(container.bottom - room, 0)
			: -Math.min(windowHeight - container.top - room, 0);
	};

	/**
	 * 滚动回调：自身的 refresh 与子组件（如 Tabs）经 onScroll 登记的回调
	 * 挂载时统一订阅当前元素所在滚动容器链（逐层向上）及页面的滚动，见 ScrollerManager.subscribe
	 */
	const handlers = new Set<() => void>();
	let unsubscribe = () => {};

	const offScroll = (handler: () => void) => {
		handlers.delete(handler);
	};

	const onScroll = (handler: () => void, options$?: { first?: boolean }) => {
		handlers.add(handler);
		// nextTick目的在与onMounted后执行
		options$?.first && nextTick(handler);
		return () => offScroll(handler);
	};

	// 只在吸附状态变化时同步 v-model，滚动中不重复发出
	let emitted: boolean | undefined;
	const refresh = () => {
		if (props.disabled) return;
		setCurrentRect();

		props.fixed ? setFixedStatus() : setStickyStatus();

		if (emitted === isActive.value) return;
		emitted = isActive.value;
		emit('update:modelValue', isActive.value);
	};

	/**
	 * 尺寸变化时重算，不必等下一次滚动：外层随容器宽度变化，固定层随内容高度变化；
	 * 窗口尺寸变化时吸附线也会变（如只改窗口高度时吸底），一并重算。
	 * 与滚动走同一组回调（自身的 refresh 也在其中），订阅方（如 Tabs、IndexBar）不必各自监听尺寸变化
	 */
	const handleResize = () => {
		measureOffset();
		handlers.forEach(fn => fn());
	};
	watch([current, content, measurer], () => {
		Resize.disconnect(handleResize);
		current.value && Resize.on(current.value, handleResize, SHARED);
		content.value && Resize.on(content.value, handleResize, SHARED);
		measurer.value && Resize.on(measurer.value, handleResize, SHARED);
	}, { flush: 'post' });

	// 等新的 offset 写到测量节点后再读取
	watch(() => props.offset, handleResize, { flush: 'post' });

	onMounted(() => {
		base = (props.target && document.querySelector<HTMLElement>(props.target)) || document.documentElement;

		if (current.value) {
			const result = ScrollerManager.subscribe(current.value, () => handlers.forEach(fn => fn()), { window: true });
			scroller = result.scrollers[0] || window;
			unsubscribe = result.off;
		}

		measureOffset();
		onScroll(refresh, { first: true });
		window.addEventListener('resize', handleResize);
	});

	onBeforeUnmount(() => {
		unsubscribe();
		Resize.disconnect(handleResize);
		window.removeEventListener('resize', handleResize);
	});

	// 吸附偏移（CSS px），供锚点滚动等换算吸附线
	const getOffset = () => offsetPx;
	// 固钉所在的滚动容器（最近一层，可能为 window）：挂载时已找到，订阅方直接取用，不必再逐层查找
	const getScroller = () => scroller;

	expose({ refresh, onScroll, offScroll, getOffset, getScroller });
	provide('vc-affix', {
		props,
		isActive,
		refresh,
		onScroll,
		offScroll,
		getOffset,
		getScroller
	});

	return () => {
		if (props.disabled) return slots.default?.({ active: false });
		return (
			<div
				ref={current}
				class={[name, { 'is-sticky': !props.fixed }]}
				style={currentStyle.value}
			>
				<div
					ref={content}
					class={{ 'vc-affix__fixed': props.fixed && isActive.value }}
					style={contentStyle.value}
				>
					{ slots.default?.({ active: isActive.value }) }
				</div>
				<div ref={measurer} class="vc-affix__measurer" style={measurerStyle.value} />
			</div>
		);
	};
};
