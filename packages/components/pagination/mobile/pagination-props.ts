import type { ExtractPropTypes, PropType } from 'vue';

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
	/**
	 * 翻页区域：default 按钮，text 文字，simple 只显示页码
	 */
	type: {
		type: String as PropType<'default' | 'text' | 'simple'>,
		default: 'default'
	},
	/**
	 * 翻页按钮位置：between 两端对齐，center 紧挨页码
	 */
	justify: {
		type: String as PropType<'between' | 'center'>,
		default: 'between'
	},
	/**
	 * 下一页样式：primary 时按钮为主色按钮，文字为主色文字
	 */
	nextType: {
		type: String as PropType<'default' | 'primary'>,
		default: 'default'
	},
	icon: Boolean,
	/**
	 * 默认取多语言文案，传入空字符串时只显示图标
	 */
	previousText: String,
	nextText: String,
	hideOnSinglePage: Boolean
};
export type Props = ExtractPropTypes<typeof props>;
