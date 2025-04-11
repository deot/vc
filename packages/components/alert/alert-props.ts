import type { ExtractPropTypes, PropType } from 'vue';

export const props = {
	modelValue: {
		type: Boolean,
		default: true
	},
	type: {
		type: String as PropType<'success' | 'info' | 'error' | 'warning'>,
		default: 'info'
	},
	title: {
		type: String,
		default: ''
	},
	desc: {
		type: String,
		default: ''
	},
	icon: {
		type: [String, Boolean],
		default: true
	},
	closable: {
		type: Boolean,
		default: false
	}
};
export type Props = ExtractPropTypes<typeof props>;
