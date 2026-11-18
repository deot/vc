import type { ExtractPropTypes, PropType } from 'vue';
import { renderType } from '../../customer/customer-props';
import type { PickerModelValue, PickerSource } from '../types';

export const props = {
	modelValue: {
		type: [String, Number, Boolean, Array] as PropType<PickerModelValue>,
		default: () => []
	},
	data: {
		type: Array as PropType<PickerSource>,
		default: () => []
	},
	columns: {
		type: Number,
		default: 1
	},
	itemStyle: Object as PropType<Record<string, any>>,
	cascader: {
		type: Boolean,
		default: true
	},
	// 级联时不渲染没有数据的列（层级不齐的数据），其余列平分宽度
	hideEmptyColumns: {
		type: Boolean,
		default: false
	},
	// 每一列只渲染可见窗口附近的行（默认开启：行高固定、只显示几行，窗口外的行本来就看不见）
	virtualized: {
		type: Boolean,
		default: true
	},
	allowDispatch: {
		type: Boolean,
		default: true
	},
	renderLabel: renderType,
	separator: {
		type: String,
		default: ','
	},
	numerable: {
		type: Boolean,
		default: false
	},
	nullValue: {
		type: [String, Number, Boolean, Array] as PropType<PickerModelValue>,
		default: void 0
	}
};

export type Props = ExtractPropTypes<typeof props>;
