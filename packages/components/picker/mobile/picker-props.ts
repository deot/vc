import type { ExtractPropTypes, PropType } from 'vue';
import type { Render } from '../../customer/types';
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
	cols: {
		type: Number,
		default: 1
	},
	itemStyle: Object as PropType<Record<string, any>>,
	cascader: {
		type: Boolean,
		default: true
	},
	loadData: Function as PropType<() => Promise<any> | any>,
	extra: {
		type: String,
		default: '请选择'
	},
	formatter: {
		type: Function as PropType<(label: any[]) => string>,
		default: (v: any[]) => (!v ? v : v.join(','))
	},
	label: String,
	labelWidth: [String, Number],
	title: {
		type: String,
		default: ''
	},
	cancelText: {
		type: String,
		default: '取消'
	},
	okText: {
		type: String,
		default: '确定'
	},
	showToolbar: {
		type: Boolean,
		default: true
	},
	renderLabel: Function as Render,
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
