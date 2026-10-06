import { getCurrentInstance, computed, onBeforeUnmount, onMounted, ref, provide, reactive, nextTick, watch } from 'vue';
import { Resize } from '@deot/helper-resize';
import { getPadding } from './utils';
import { ScrollerManager } from './manager';
import type { SetupContext } from 'vue';
import type { BarExposed } from './bar';
import type { Props } from './scroller-props';

export const useScroller = (expose: SetupContext['expose']) => {
	const instance = getCurrentInstance()!;

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

	const props = instance.props as Props;

	const wrapperStyle = computed(() => {
		const style = {} as Record<string, string>;

		if (props.height) {
			style.height = typeof props.height !== 'number' ? props.height : `${props.height}px`;
		}
		if (props.maxHeight) {
			style.maxHeight = typeof props.maxHeight !== 'number' ? props.maxHeight : `${props.maxHeight}px`;
		}

		return [props.wrapperStyle, style];
	});

	// 是否使用原生滚动条：always（常显）只有自绘滚动条能做到，设置后不再使用原生滚动条
	const isNative = computed(() => props.native && !props.always);

	const wrapperClass = computed(() => {
		return [
			props.wrapperClass,
			isNative.value ? 'is-native' : 'is-hidden'
		];
	});

	const refreshSize = async () => {
		if (!wrapper.value) return;

		wrapperW.value = wrapper.value.clientWidth;
		wrapperH.value = wrapper.value.clientHeight;

		const padding = getPadding(wrapper.value);
		padding.join() !== wrapperPadding.value.join() && (wrapperPadding.value = padding);

		// 实际测试中发现，不使用nextTick会存在contentW和contentH为上一次值的情况
		await nextTick();
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

		instance.emit('scroll', e);
		listeners.forEach(listener => listener(e));
	};

	const scrollTo = (options?: any) => {
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
	provide('vc-scroller', reactive(exposed));

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

		handleScroll,
		handleBarChange: scrollTo,

		refreshPosition
	};
};
