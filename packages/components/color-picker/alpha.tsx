/** @jsxImportSource vue */

import { defineComponent, nextTick, onMounted, ref, watch } from 'vue';
import type { PropType } from 'vue';
import { Color } from './color';
import { useDraggable } from './use-draggable';

const COMPONENT_NAME = 'vc-color-picker-alpha';

const getWidth = (element: HTMLElement) => {
	const rect = element.getBoundingClientRect();
	return rect.width || element.clientWidth || element.offsetWidth;
};

export const Alpha = defineComponent({
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
		const background = ref('');
		const thumbLeft = ref(0);

		const handleDrag = (e: MouseEvent) => {
			const element = slider.value;
			if (!element) return;

			const rect = element.getBoundingClientRect();
			const width = rect.width || element.clientWidth || element.offsetWidth;
			if (!width) return;

			let left = e.clientX - rect.left;

			left = Math.min(left, width);
			left = Math.max(left, 0);

			props.color.states.alpha = Math.round((left / width) * 100);
		};

		const getBackground = () => {
			const { r, g, b } = props.color.toRgb();

			return `linear-gradient(to right, rgba(${r}, ${g}, ${b}, 0) 0%, rgba(${r}, ${g}, ${b}, 1) 100%)`;
		};

		const update = () => {
			const element = slider.value;
			if (!element) return;

			const width = getWidth(element);
			const thumbWidth = thumb.value?.offsetWidth || 0;
			const alpha = props.color.states.alpha;

			thumbLeft.value = width
				? Math.round((alpha / 100) * (width - thumbWidth))
				: 0;
			background.value = getBackground();
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
			() => [props.color.states.alpha, props.color.states.output],
			update
		);

		return () => (
			<div ref={slider} class="vc-color-picker-alpha">
				<div
					ref={bar}
					style={{ background: background.value }}
					class="vc-color-picker-alpha__bar"
				/>
				<div
					ref={thumb}
					style={{
						top: 0,
						left: `${thumbLeft.value}px`
					}}
					class="vc-color-picker-alpha__thumb"
				/>
			</div>
		);
	}
});
