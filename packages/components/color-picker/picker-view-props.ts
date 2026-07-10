import type { ExtractPropTypes, PropType } from 'vue';
import type { ColorFormat } from './color';

export const props = {
	modelValue: {
		type: String,
		default: ''
	},
	panel: {
		type: Boolean,
		default: true
	},
	alpha: {
		type: Boolean,
		default: false
	},
	hue: {
		type: Boolean,
		default: true
	},
	recommend: {
		type: Boolean,
		default: false
	},
	colors: {
		type: Array as PropType<string[]>,
		default: () => []
	},
	format: {
		type: String as PropType<ColorFormat>,
		validator: (v: string) => /(hsl|hsv|hex|rgb)/.test(v)
	}
};
export type Props = ExtractPropTypes<typeof props>;
