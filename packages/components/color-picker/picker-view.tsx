/** @jsxImportSource vue */

import { defineComponent, ref, watch } from 'vue';
import { Color } from './color';
import { props as pickerViewProps } from './picker-view-props';
import { COLORS } from './constants';
import { Panel } from './panel';
import { HueSlider } from './hue-slider';
import { Alpha } from './alpha';
import { Predefine } from './predefine';

const COMPONENT_NAME = 'vc-color-picker-view';

export const ColorPickerView = defineComponent({
	name: COMPONENT_NAME,
	props: pickerViewProps,
	emits: ['change', 'update:modelValue'],
	setup(props, { emit }) {
		const recommendColors = ref([...COLORS]);
		const color = new Color({
			enableAlpha: props.alpha,
			format: props.format,
			value: props.modelValue
		});

		const emitChange = () => {
			emit('update:modelValue', color.states.output, color);
			emit('change', color.states.output, color);
		};

		watch(
			() => props.modelValue,
			(v) => {
				if (v !== color.states.output) {
					color.setColor(v);
				}
			}
		);

		watch(
			() => [props.alpha, props.format] as const,
			([alpha, format]) => {
				color.setOptions({ enableAlpha: alpha, format });
			}
		);

		watch(
			() => color.states.output,
			emitChange,
		);

		return () => (
			<>
				{props.panel && <Panel color={color} />}
				{props.hue && <HueSlider color={color} />}
				{props.alpha && <Alpha color={color} />}
				{
					props.colors.length > 0 && (
						<Predefine colors={props.colors} color={color} />
					)
				}
				{
					!props.colors.length && props.recommend && (
						<Predefine colors={recommendColors.value} color={color} />
					)
				}
			</>
		);
	}
});
