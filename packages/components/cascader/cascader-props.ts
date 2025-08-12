import type { ExtractPropTypes, PropType } from 'vue';
import { props as selectProps } from '../select/select-props';
import { TreeData } from '../select/utils';

export const props = {
	...selectProps,
	data: {
		type: Array as PropType<TreeData[]>,
		default: () => ([])
	},
	format: {
		type: Function,
		default: (v: any[]) => (v && v.join(' / '))
	},
	changeOnSelect: {
		type: Boolean,
		default: false
	},
	autoWidth: {
		type: Boolean,
		default: true
	}
};
export type Props = ExtractPropTypes<typeof props>;
