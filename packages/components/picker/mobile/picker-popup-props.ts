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
	cancelText: {
		type: String,
		default: '取消'
	},
	okText: {
		type: String,
		default: '确定'
	},
	showToolbar: {
		type: Boolean,
		default: true
	}
};

export type Props = ExtractPropTypes<typeof props>;
