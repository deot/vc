import type { ExtractPropTypes, PropType } from 'vue';
import { pick } from 'lodash-es';
import { props as inputProps, plaintextProps } from '../input/input-props';
import { props as popoverProps } from '../popover/popover-props';
import { renderType, valueType } from '../customer/customer-props';
import type { SearchMatch } from './utils';

const inputKeys = [
	'id',
	'disabled',
	'clearable'
] as const;

const popoverKeys = [
	'portal',
	'portalClass'
] as const;

export const props = {
	...(pick(popoverProps, popoverKeys) as Pick<typeof popoverProps, typeof popoverKeys[number]>),
	...(pick(inputProps, inputKeys) as Pick<typeof inputProps, typeof inputKeys[number]>),
	// 选项值可为布尔；显式 default 避免 Vue 把未传的布尔类型 prop 转成 false
	modelValue: {
		type: [String, Number, Boolean, Array] as PropType<string | number | boolean | any[]>,
		default: undefined
	},
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
	// 1：单选；大于 1：多选，最多选 max 项（达到后未选中的项禁用）；0：多选，不限数量
	max: {
		type: Number,
		default: 1,
		validator: (v: any) => v >= 0,
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
	// 搜索关键词的分隔符：{ and, or }，and 分开的词都要命中，or 分开的组命中任一即可；未传时读全局配置，默认 { and: ' ', or: [',', '，'] }，见 SearchMatch
	searchMatch: Object as PropType<SearchMatch>,
	// 多选时选中（或取消）一项后清空搜索词，便于接着搜下一项；false 时保留，可在同一批结果里继续选
	clearSearchOnSelect: {
		type: Boolean,
		default: true
	},
	loadData: {
		type: Function,
	},
	// 只渲染视口附近的选项（RecycleList），用于大量数据；搜索结果同样生效
	virtualized: {
		type: Boolean,
		default: false
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
	label: valueType,
	// 只显示已选项的文字（按 value 在 data 中查出 label，经 formatter），不渲染触发器与弹层：没有样式，不能交互；没有值时显示 extra
	plaintext: plaintextProps.plaintext,
	// 根据已选项的文字生成显示内容，同 MSelect：用于单选触发器的文字（需返回字符串）与 plaintext（可返回 VNode）
	formatter: {
		type: Function as PropType<(labels: string[], value: any) => any>,
		default: (labels: string[]) => labels.filter(Boolean).join(', ')
	}
};
export type Props = ExtractPropTypes<typeof props>;
