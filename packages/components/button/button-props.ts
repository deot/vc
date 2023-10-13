import type { ExtractPropTypes, PropType } from 'vue';

export const props = {
	tag: {
		type: String,
		default: 'button'
	},
	type: {
		type: String as PropType<'default' |' primary' |' text' |' success' |' error' |' warning'>,
		default: 'default'
	},
	size: {
		type: String as PropType<'small' | 'medium' | 'large'>,
		default: 'medium'
	},
	wait: {
		type: Number,
		default: 250
	},
	icon: String,
	disabled: Boolean,
	circle: Boolean,
	round: Boolean,
	long: Boolean,
	htmlType: {
		type: String as PropType<'button' | 'submit' | 'reset'>,
		default: 'button'
	},
};
export type Props = ExtractPropTypes<typeof props>;