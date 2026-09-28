import type { ExtractPropTypes, PropType } from 'vue';
import type { Render } from '../customer/types';

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
	pauseOffset: {
		type: Number,
		default: 30
	},
	// 是否允许进入拉动（由使用方判断主轴是否停在刷新一侧的端点：正序为起点，inverted 为终点）
	canPull: {
		type: Function as PropType<() => boolean>,
		default: () => true
	},
	render: Function as Render
};
export type Props = ExtractPropTypes<typeof props>;
