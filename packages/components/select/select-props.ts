import type { ExtractPropTypes, PropType } from 'vue';
import { pick } from 'lodash-es';
import { props as inputProps } from '../input/input-props';
import { props as popoverProps } from '../popover/popover-props';
import { renderType, valueType } from '../customer/customer-props';

const inputKeys = [
	'id',
	'disabled',
	'modelValue',
	'clearable'
] as const;

const popoverKeys = [
	'portal',
	'portalClass'
] as const;

export const props = {
	...(pick(popoverProps, popoverKeys) as Pick<typeof popoverProps, typeof popoverKeys[number]>),
	...(pick(inputProps, inputKeys) as Pick<typeof inputProps, typeof inputKeys[number]>),
	renderOption: renderType,
	renderOptionGroup: renderType,
	renderLabel: renderType,
	data: {
		type: Array,
		default: () => ([])
	},
	searchPlaceholder: {
		type: String,
		default: ''
	},
	trigger: {
		type: String,
		default: 'click'
	},
	tag: {
		type: String,
		default: 'div'
	},
	placement: {
		type: String,
		default: 'bottom-left'
	},
	arrow: {
		type: Boolean,
		default: false
	},
	autoWidth: {
		type: Boolean,
		default: false
	},
	max: {
		type: Number,
		default: 1,
		validator: (v: any) => v >= 1,
	},
	maxTags: Number,
	// 多选标签最多占用的行数，放不下的折叠为 +N...；0 表示不限
	maxTagLines: {
		type: Number,
		default: 1
	},
	// true / 'inline'：在触发器内直接输入；'popover'：弹层顶部的搜索栏
	searchable: {
		type: [Boolean, String] as PropType<boolean | 'inline' | 'popover'>,
		default: false,
		validator: (v: any) => typeof v === 'boolean' || ['inline', 'popover'].includes(v)
	},
	loadData: {
		type: Function,
	},
	extra: {
		type: String,
		default: ''
	},
	// 当输入为字符串数组('value1,value2')时，用于判断是否单选还是多选
	separator: {
		type: String,
		default: ','
	},
	// 当输入为字符串数组时，如果data[].value是数字类型时，请传true
	numerable: {
		type: Boolean,
		default: false
	},

	// 清空值时返回的值
	nullValue: {
		type: [Number, String, Object],
		default: void 0
	},
	label: valueType
};
export type Props = ExtractPropTypes<typeof props>;
