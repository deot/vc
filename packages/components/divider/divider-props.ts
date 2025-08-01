import type { ExtractPropTypes } from 'vue';

export const props = {
	vertical: {
		type: Boolean,
		default: false,
	},
	placement: {
		type: String,
		default: 'center',
		validator(val: string): boolean {
			return ['left', 'center', 'right'].indexOf(val) !== -1;
		}
	}
};
export type Props = ExtractPropTypes<typeof props>;
