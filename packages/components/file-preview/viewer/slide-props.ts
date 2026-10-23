import type { ExtractPropTypes, PropType } from 'vue';
import type { FilePreviewItem } from '../types';

// 图片、视频、音频、文件页共用
export const props = {
	row: {
		type: Object as PropType<FilePreviewItem>,
		required: true as const
	},
	active: Boolean
};
export type Props = ExtractPropTypes<typeof props>;
