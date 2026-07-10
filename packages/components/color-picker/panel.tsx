/** @jsxImportSource vue */

import { computed, defineComponent, nextTick, onMounted, ref, watch } from 'vue';
import type { PropType } from 'vue';
import { Color } from './color';
import { useDraggable } from './use-draggable';

const COMPONENT_NAME = 'vc-color-picker-panel';

const getRect = (element: HTMLElement) => {
	const rect = element.getBoundingClientRect();

	return {
		x: rect.x,
		y: rect.y,
		top: rect.top,
		right: rect.right,
		bottom: rect.bottom,
		left: rect.left,
		width: rect.width || element.clientWidth,
		height: rect.height || element.clientHeight
	};
};

export const Panel = defineComponent({
	name: COMPONENT_NAME,
	props: {
		color: {
			type: Object as PropType<Color>,
			required: true
		}
	},
	setup(props) {
		const panel = ref<HTMLElement>();
		const background = ref('hsl(0, 100%, 50%)');
		const cursorTop = ref(0);
		const cursorLeft = ref(0);

		const colorValue = computed(() => {
			return {
				hue: props.color.states.hue,
				saturation: props.color.states.saturation,
				value: props.color.states.value
			};
		});

		const update = () => {
			if (!panel.value) return;

			const saturation = props.color.states.saturation;
			const value = props.color.states.value;
			const { width, height } = getRect(panel.value);

			cursorLeft.value = width ? (saturation * width) / 100 : 0;
			cursorTop.value = height ? ((100 - value) * height) / 100 : 0;
			background.value = `hsl(${props.color.states.hue}, 100%, 50%)`;
		};

		const handleDrag = (e: MouseEvent) => {
			if (!panel.value) return;

			const rect = getRect(panel.value);
			if (!rect.width || !rect.height) return;

			let left = e.clientX - rect.left;
			let top = e.clientY - rect.top;

			left = Math.max(0, Math.min(left, rect.width));
			top = Math.max(0, Math.min(top, rect.height));

			cursorLeft.value = left;
			cursorTop.value = top;
			props.color.states.saturation = (left / rect.width) * 100;
			props.color.states.value = 100 - (top / rect.height) * 100;
		};

		useDraggable(() => panel.value, {
			start: handleDrag,
			drag: handleDrag,
			end: handleDrag
		});

		onMounted(() => {
			nextTick(update);
		});

		watch(colorValue, update);

		return () => (
			<div
				ref={panel}
				style={{ background: background.value }}
				class="vc-color-picker-panel"
			>
				<div class="vc-color-picker-panel__white" />
				<div class="vc-color-picker-panel__black" />
				<div
					style={{
						top: `${cursorTop.value}px`,
						left: `${cursorLeft.value}px`
					}}
					class="vc-color-picker-panel__cursor"
				>
					<div />
				</div>
			</div>
		);
	}
});
