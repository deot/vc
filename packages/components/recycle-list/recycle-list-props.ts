import type { ExtractPropTypes, PropType } from 'vue';
import type { Render } from '../customer/types';
import type { Props as ScrollerProps } from '../scroller/scroller-props';

export const props = {
	dataSource: {
		type: Array,
		default: () => ([])
	},
	disabled: {
		type: Boolean,
		default: false
	},

	pageSize: {
		type: Number,
		default: 20
	},

	// 底部拉取更多数据的距离
	offset: {
		type: Number,
		default: 100
	},

	loadData: {
		type: Function,
		default: () => false
	},

	cols: {
		type: Number,
		default: 1
	},

	gutter: {
		type: Number,
		default: 0
	},

	inverted: {
		type: Boolean,
		default: false
	},

	pullable: {
		type: Boolean,
		default: false
	},

	// 默认纵向滚动
	vertical: {
		type: Boolean,
		default: true
	},

	scrollerOptions: Object as PropType<ScrollerProps>,

	renderEmpty: Function as Render,
	renderFinish: Function as Render,
	renderLoading: Function as Render,
	renderPlaceholder: Function as Render,
	renderRefresh: Function as Render
};
export type Props = ExtractPropTypes<typeof props>;
