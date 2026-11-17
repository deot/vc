/** @jsxImportSource vue */

import { defineComponent, ref } from 'vue';
import type { PropType } from 'vue';
import type { DragPoint } from '@deot/vc-hooks';
import { Color } from '../color';
import { useDraggable } from '../hooks/use-draggable';

const COMPONENT_NAME = 'vc-color-picker-panel';

const clamp = (value: number) => Math.min(100, Math.max(0, value));

// 方向键对应的通道和方向：左右调饱和度，上下调明度
const KEYS: Record<string, ['saturation' | 'value', 1 | -1]> = {
	ArrowLeft: ['saturation', -1],
	ArrowRight: ['saturation', 1],
	ArrowUp: ['value', 1],
	ArrowDown: ['value', -1]
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

		// 只在拖动时测量；光标按百分比定位，不受容器尺寸变化影响
		const handleDrag = (e: DragPoint) => {
			const el = panel.value;
			if (!el) return;

			const rect = el.getBoundingClientRect();
			const width = rect.width || el.clientWidth;
			const height = rect.height || el.clientHeight;
			if (!width || !height) return;

			props.color.set({
				saturation: clamp(((e.clientX - rect.left) / width) * 100),
				value: clamp(100 - ((e.clientY - rect.top) / height) * 100)
			});
		};

		const listeners = useDraggable(handleDrag);

		// 方向键 ±1，按住 Shift ±10
		const handleKeydown = (e: KeyboardEvent) => {
			const key = KEYS[e.key];
			if (!key) return;

			e.preventDefault();
			const [channel, direction] = key;
			props.color.set(channel, clamp(Math.round(props.color.states[channel]) + direction * (e.shiftKey ? 10 : 1)));
		};

		return () => {
			const { hue, saturation, value, output } = props.color.states;

			return (
				<div
					ref={panel}
					style={{ background: `hsl(${hue}, 100%, 50%)` }}
					class="vc-color-picker-panel"
					role="slider"
					tabindex={0}
					aria-valuetext={output}
					onKeydown={handleKeydown}
					{...listeners}
				>
					<div class="vc-color-picker-panel__white" />
					<div class="vc-color-picker-panel__black" />
					<div
						style={{
							top: `${100 - value}%`,
							left: `${saturation}%`
						}}
						class="vc-color-picker-panel__cursor"
					>
						<div />
					</div>
				</div>
			);
		};
	}
});
