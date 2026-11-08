import type { ExtractPropTypes, PropType } from 'vue';

export const props = {
	vertical: {
		type: Boolean,
		default: false
	},
	circle: {
		type: Boolean,
		default: false
	},
	size: {
		type: String as PropType<'mini' | 'small' | 'medium' | 'large'>,
		default: 'medium'
	},
	styleless: {
		type: Boolean,
		default: false
	}
};
export type Props = ExtractPropTypes<typeof props>;
