import type { ExtractPropTypes, PropType } from 'vue';
import { valueType } from '../customer/customer-props';

export const props = {
	content: valueType,
	mask: {
		type: Boolean,
		default: true
	},
	maskClosable: {
		type: Boolean,
		default: true
	},
	fixed: {
		type: Boolean,
		default: true
	},
	// 单位ms；鼠标悬停时暂停
	duration: {
		type: Number,
		default: 3000
	},
	// 固定定位时第一条提示距页面顶部的距离（px），同一 top 的多条提示依次向下排列
	top: {
		type: Number,
		default: 30,
	},
	closable: {
		type: Boolean,
		default: false,
	},
	mode: {
		type: String as PropType<'info' | 'loading' | 'success' | 'warning' | 'error'>,
		default: 'info',
		validator: (v: string) => /(info|loading|success|error|warning)/.test(v)
	},
	// 这个相当于Modal中的onCancel，支持Promise
	onBeforeClose: Function
};
export type Props = ExtractPropTypes<typeof props>;
