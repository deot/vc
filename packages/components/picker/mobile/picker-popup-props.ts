import type { ExtractPropTypes, PropType } from 'vue';

export const props = {
	modelValue: {
		type: Boolean,
		default: true
	},
	visible: {
		type: Boolean as PropType<boolean | undefined>,
		default: undefined
	},
	title: {
		type: String,
		default: ''
	},
	cancelText: String,
	okText: String,
	showToolbar: {
		type: Boolean,
		default: true
	}
};

export type Props = ExtractPropTypes<typeof props>;
