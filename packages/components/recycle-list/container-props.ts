import type { ExtractPropTypes, PropType } from 'vue';
import type { Render } from '../customer/types';
import { STATUS_MAP } from './container-constant';

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
	// 是否允许进入下拉（由使用方判断主轴是否停在起点）
	canPull: {
		type: Function as PropType<() => boolean>,
		default: () => true
	},
	render: {
		type: Function as Render,
		default: ({ status, type }) => STATUS_MAP[type][status]
	}
};
export type Props = ExtractPropTypes<typeof props>;
