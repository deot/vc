import type { ExtractPropTypes } from 'vue';
import { renderType } from '../../customer/customer-props';

export const props = {
	value: {
		type: [String, Number],
		required: true
	},
	label: {
		type: [String, Number]
	},
	disabled: {
		type: Boolean,
		default: false
	},
	// 搜索词的正则：命中的部分高亮；由列表渲染时传入，搜索词变化时随列表一次更新，不必每个选项各自订阅
	regex: RegExp,
	render: renderType,
	renderLabel: renderType,
	row: Object
};
export type Props = ExtractPropTypes<typeof props>;
