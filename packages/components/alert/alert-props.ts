import type { ExtractPropTypes, PropType } from 'vue';
import { valueType } from '../customer/customer-props';
import type { Props as MarqueeProps } from '../marquee/marquee-props';

export const props = {
	modelValue: {
		type: Boolean,
		default: true
	},
	type: {
		type: String as PropType<'success' | 'info' | 'error' | 'warning'>,
		default: 'info'
	},
	title: {
		type: valueType,
		default: ''
	},
	description: {
		type: valueType,
		default: ''
	},
	icon: {
		type: [String, Boolean],
		default: true
	},
	closable: {
		type: Boolean,
		default: false
	},
	// 标题行超出宽度时滚动（跑马灯），标题不再换行
	marquee: {
		type: Boolean,
		default: false
	},
	// 透传给 Marquee 的属性，如 always / speed / delay / gap / pauseOnHover；delay 默认 1000
	marqueeOptions: {
		type: Object as PropType<Partial<MarqueeProps>>,
		default: () => ({})
	}
};
export type Props = ExtractPropTypes<typeof props>;
