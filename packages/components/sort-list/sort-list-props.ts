import type { ExtractPropTypes, PropType } from 'vue';

export type SortListRow = any;
export type SortListPrimaryKey = string | number;

export const props = {
	modelValue: {
		type: Array as PropType<SortListRow[]>,
		default: () => []
	},
	tag: {
		type: String,
		default: 'div'
	},
	primaryKey: {
		type: [String, Number] as PropType<SortListPrimaryKey>,
		default: 'id'
	},
	mask: {
		type: Boolean,
		default: true
	},
	draggable: {
		type: Boolean,
		default: true
	},
	draggableKey: {
		type: [String, Number] as PropType<SortListPrimaryKey>,
		default: undefined
	}
};
export type Props = ExtractPropTypes<typeof props>;
