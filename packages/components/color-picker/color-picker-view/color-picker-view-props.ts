import type { ExtractPropTypes, PropType } from 'vue';
import type { ColorFormat } from '../color';

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
	// 预设色：true 使用内置色（ColorPicker.colors），数组为自定义色
	colors: {
		type: [Boolean, Array] as PropType<boolean | string[]>,
		default: false
	},
	format: {
		type: String as PropType<ColorFormat>,
		validator: (v: string) => /(hsl|hsv|hex|rgb)/.test(v)
	}
};
export type Props = ExtractPropTypes<typeof props>;
