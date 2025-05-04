import type { ExtractPropTypes } from 'vue';
import { getUid } from '@deot/helper-utils';

export const props = {
	modelValue: {
		type: [String, Number],
		default: ''
	},
	type: {
		type: String,
		default: '', // 'button'
	},
	vertical: {
		type: Boolean,
		default: false
	},
	name: {
		type: String,
		default: () => getUid('radio')
	},
	disabled: {
		type: Boolean,
		default: false
	},
	fragment: {
		type: Boolean,
		default: false
	}
};
export type Props = ExtractPropTypes<typeof props>;
