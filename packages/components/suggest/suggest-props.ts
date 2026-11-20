import type { ExtractPublicPropTypes, PropType } from 'vue';
import { pick } from 'lodash-es';
import { props as popoverProps } from '../popover/popover-props';
import { renderType } from '../customer/customer-props';

const popoverKeys = [
	'portal',
	'portalClass'
] as const;

export type SuggestData = Array<string | number | Record<string, any>>;

/**
 * 联想组件（AutoComplete、Mention、Editor 的 mentionOptions）共用的属性：数据、远程加载、渲染、虚拟列表、弹层
 */
export const props = {
	...(pick(popoverProps, popoverKeys) as Pick<typeof popoverProps, typeof popoverKeys[number]>),
	// 联想项：同 Select 的 data（{ label, value, disabled, children, filterable }，带 children 的为分组）；也可以是字符串、数字
	data: {
		type: Array as PropType<SuggestData>,
		default: () => ([])
	},
	// 远程加载：输入经 250ms 防抖后调用，返回 Promise；由调用方更新 data，Promise 解析为数组时直接作为这次的结果
	loadData: Function,
	renderOption: renderType,
	renderOptionGroup: renderType,
	renderLabel: renderType,
	// 只渲染视口附近的联想项（RecycleList），用于大量数据
	virtualized: {
		type: Boolean,
		default: false
	},
	placement: {
		type: String,
		default: 'bottom-left'
	}
};

/**
 * useSuggest 读取的属性（组件的 props，或 Editor 合并了 SUGGEST_DEFAULTS 的 mentionOptions）
 */
export type SuggestConfig = Partial<ExtractPublicPropTypes<typeof props>>;

// 不经过组件 props 时（Editor 的 mentionOptions）使用的默认值，与上面的 default 一致
export const SUGGEST_DEFAULTS: SuggestConfig = Object.freeze({
	data: Object.freeze([]) as unknown as SuggestData,
	virtualized: false,
	placement: 'bottom-left',
	portal: true
});
