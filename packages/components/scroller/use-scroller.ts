import { getCurrentInstance, computed, ref } from 'vue';
import type { SetupContext } from 'vue';
import type { BarExposed } from './bar';
import type { Props } from './scroller-props';

export const useScroller = (expose: SetupContext['expose']) => {
	const instance = getCurrentInstance()!;

	const bar = ref<BarExposed>();
	const wrapper = ref<HTMLElement>();
	const content = ref<HTMLElement>();

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

	const wrapperClassName = computed(() => {
		return [
			props.wrapperClassName,
			props.native ? 'is-native' : 'is-hidden',
			'vc-scroller__wrapper'
		];
	});

	const handleScroll = (e: UIEvent) => {
		instance.emit('scroll', e);
		bar.value!.refreshTrack();
	};

	// 以下两个暴露scroll事件, 从而触发handleScroll
	expose({
		wrapper,
		refresh: () => {
			bar.value!.refresh();
		},
		setScrollTop: (value: number) => {
			wrapper.value!.scrollTop = value;
		},
		setScrollLeft: (value: number) => {
			wrapper.value!.scrollLeft = value;
		}
	});

	return {
		bar,
		wrapper,
		content,
		wrapperStyle,
		wrapperClassName,
		handleScroll
	};
};
