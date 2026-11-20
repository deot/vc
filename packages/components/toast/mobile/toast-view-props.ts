import type { ExtractPropTypes, PropType } from 'vue';
import { valueType } from '../../customer/customer-props';

export const props = {
	content: valueType,
	// 透明遮罩：显示期间遮挡页面操作
	mask: {
		type: Boolean,
		default: true
	},
	// 点击遮罩关闭，仅 mask 为 true 时生效
	maskClosable: {
		type: Boolean,
		default: true
	},
	// 单位ms
	duration: {
		type: Number,
		default: 3000
	},
	mode: {
		type: String as PropType<'info' | 'loading' | 'success' | 'warning' | 'error'>,
		default: 'info',
		validator: (val: string) => ['info', 'loading', 'success', 'warning', 'error'].includes(val)
	},
	// 居中，或距顶部 / 底部 30%
	placement: {
		type: String as PropType<'top' | 'center' | 'bottom'>,
		default: 'center',
		validator: (val: string) => ['top', 'center', 'bottom'].includes(val)
	}
};
export type Props = ExtractPropTypes<typeof props>;
