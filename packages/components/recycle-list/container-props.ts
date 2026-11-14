import type { ExtractPropTypes, PropType } from 'vue';
import { renderType } from '../customer/customer-props';

export const props = {
	inverted: {
		type: Boolean,
		default: false
	},
	vertical: {
		type: Boolean,
		default: true
	},
	pullable: {
		type: Boolean,
		default: false
	},
	// 是否允许进入拉动（由使用方判断主轴是否停在刷新一侧的端点：正序为起点，inverted 为终点）
	canPull: {
		type: Function as PropType<() => boolean>,
		default: () => true
	},
	// 移动端（MRecycleList）：渲染函数的参数 mobile 为 true
	mobile: Boolean,
	render: renderType
};
export type Props = ExtractPropTypes<typeof props>;
