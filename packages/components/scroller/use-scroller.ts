import { getCurrentInstance, computed, onBeforeUnmount, onMounted, ref, provide, reactive } from 'vue';
import { Resize } from '@deot/helper-resize';
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

	const wrapperClass = computed(() => {
		return [
			props.wrapperClass,
			props.native ? 'is-native' : 'is-hidden',
			'vc-scroller__wrapper'
		];
	});

	const refreshSize = () => {
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

	const refresh = (options?: any) => {
		refreshSize();
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
			listeners.splice(listeners.indexOf(listener), 1);
		}
	};
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
		scrollTo,

		scrollX,
		scrollY,
		wrapperW,
		wrapperH,
		contentH,
		contentW,

		handleScroll,
		handleBarChange: scrollTo,

		refreshPosition
	};
};
