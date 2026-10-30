import type { ExtractPropTypes, PropType } from 'vue';
import type { ClipboardValue } from './utils';

export const props = {
	value: [String, Object] as PropType<ClipboardValue>,
	tag: {
		type: [String, Object, Function],
		default: 'div'
	}
};
export type Props = ExtractPropTypes<typeof props>;
