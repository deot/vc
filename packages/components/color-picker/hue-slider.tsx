/** @jsxImportSource vue */

import { defineComponent, nextTick, onMounted, ref, watch } from 'vue';
import type { PropType } from 'vue';
import { Color } from './color';
import { useDraggable } from './use-draggable';

const COMPONENT_NAME = 'vc-color-picker-hue-slider';

const getWidth = (element: HTMLElement) => {
	const rect = element.getBoundingClientRect();
	return rect.width || element.clientWidth || element.offsetWidth;
};

export const HueSlider = defineComponent({
	name: COMPONENT_NAME,
	props: {
		color: {
			type: Object as PropType<Color>,
			required: true
		}
	},
	setup(props) {
		const slider = ref<HTMLElement>();
		const bar = ref<HTMLElement>();
		const thumb = ref<HTMLElement>();
		const thumbLeft = ref(0);

		const handleDrag = (e: MouseEvent) => {
			if (!slider.value) return;

			const rect = slider.value.getBoundingClientRect();
			const width = rect.width || slider.value.clientWidth || slider.value.offsetWidth;
			if (!width) return;

			let left = e.clientX - rect.left;

			left = Math.min(left, width);
			left = Math.max(left, 0);

			props.color.states.hue = Math.round((left / width) * 360);
		};

		const update = () => {
			if (!slider.value) return;

			const width = getWidth(slider.value);
			const thumbWidth = thumb.value?.offsetWidth || 0;
			const hue = props.color.states.hue;

			thumbLeft.value = width
				? Math.round((hue * (width - thumbWidth / 2)) / 360)
				: 0;
		};

		const dragConfig = {
			start: handleDrag,
			drag: handleDrag,
			end: handleDrag
		};

		useDraggable(() => bar.value, dragConfig);
		useDraggable(() => thumb.value, dragConfig);

		onMounted(() => {
			nextTick(update);
		});

		watch(
			() => props.color.states.hue,
			update
		);

		return () => (
			<div ref={slider} class="vc-color-picker-hue-slider">
				<div ref={bar} class="vc-color-picker-hue-slider__bar" />
				<div
					ref={thumb}
					style={{
						top: 0,
						left: `${thumbLeft.value}px`
					}}
					class="vc-color-picker-hue-slider__thumb"
				/>
			</div>
		);
	}
});
