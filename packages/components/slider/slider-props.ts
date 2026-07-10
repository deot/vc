import type { ExtractPropTypes, PropType } from 'vue';

export type SliderValue = number | [number, number] | number[];
export type SliderTipValue = string | number | null | undefined;
export type SliderButtonType = 'min' | 'max';
export type SliderShowTip = 'hover' | 'always' | 'never';

export const props = {
	modelValue: {
		type: [Number, Array] as PropType<SliderValue>,
		default: 0
	},
	min: {
		type: Number,
		default: 0
	},
	max: {
		type: Number,
		default: 100
	},
	step: {
		type: Number,
		default: 1
	},
	range: {
		type: Boolean,
		default: false
	},
	disabled: {
		type: Boolean,
		default: false
	},
	clickable: {
		type: Boolean,
		default: true
	},
	showStops: {
		type: Boolean,
		default: false
	},
	formatter: {
		type: Function as PropType<(value: number) => SliderTipValue>,
		default: (value: number) => `${value}`
	},
	showInput: {
		type: Boolean,
		default: false
	},
	showTip: {
		type: String as PropType<SliderShowTip>,
		default: 'hover',
		validator: (value: string) => /^(hover|always|never)$/.test(value)
	}
};
export type Props = ExtractPropTypes<typeof props>;
