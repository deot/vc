import type { ExtractPropTypes, PropType } from 'vue';
import { renderType, valueType } from '../../customer/customer-props';
import type { PickerModelValue, PickerSource } from '../types';
import { props as pickerPopupProps } from './picker-popup-props';

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
	loadData: Function as PropType<() => Promise<any> | any>,
	extra: String,
	formatter: {
		type: Function as PropType<(label: any[]) => string>,
		default: (v: any[]) => (!v ? v : v.join(','))
	},
	label: String,
	labelWidth: [String, Number],
	title: {
		type: valueType,
		default: ''
	},
	cancelText: String,
	okText: String,
	// 「确定」的位置；false 时不需要确认，滚轮停下即提交
	confirm: pickerPopupProps.confirm,
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
