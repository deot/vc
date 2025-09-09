import type { ExtractPropTypes } from 'vue';

export const props = {
	// canvas配置参数
	options: Object,
	width: {
		type: Number,
		default: 0
	},
	height: {
		type: Number,
		default: 0
	},
};
export type Props = ExtractPropTypes<typeof props>;
