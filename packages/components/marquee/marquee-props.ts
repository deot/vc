import type { ExtractPropTypes, PropType } from 'vue';
import { valueType } from '../customer/customer-props';

export const props = {
	// 每秒移动多少 px
	speed: {
		type: Number,
		default: 50,
	},
	content: valueType,
	// 滚动方向：内容朝哪个方向移动
	direction: {
		type: String as PropType<'left' | 'right' | 'up' | 'down'>,
		default: 'left'
	},
	// 首尾两份内容的间距（px），不传时取 --vc-marquee-gap
	gap: Number,
	animated: {
		type: Boolean,
		default: true,
	},
	// 内容未溢出时也滚动
	always: {
		type: Boolean,
		default: false
	},
	pauseOnHover: {
		type: Boolean,
		default: true
	},
	// 开始滚动前停留的时长（毫秒）
	delay: {
		type: Number,
		default: 0
	}
};
export type Props = ExtractPropTypes<typeof props>;
