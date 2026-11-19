import type { ExtractPropTypes } from 'vue';

export const props = {
	value: {
		type: String,
		default: undefined
	},
	// 点击内容里的图片是否打开预览
	previewable: {
		type: Boolean,
		default: true
	}
};
export type Props = ExtractPropTypes<typeof props>;
