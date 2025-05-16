import type { ExtractPropTypes } from 'vue';

export const props = {
	current: {
		type: Number,
		default: 1
	},
	count: {
		type: Number,
		default: 0
	},
	pageSize: {
		type: Number,
		default: 10
	},
	pageSizeOptions: {
		type: Array,
		default: () => ([10, 20, 30, 40])
	},
	placement: {
		type: String,
		default: 'bottom'
	},
	portal: {
		type: Boolean,
		default: true
	},
	showCount: {
		type: Boolean,
		default: true
	},
	showElevator: {
		type: Boolean,
		default: false
	},
	showSizer: {
		type: Boolean,
		default: false
	},
};
export type Props = ExtractPropTypes<typeof props>;
