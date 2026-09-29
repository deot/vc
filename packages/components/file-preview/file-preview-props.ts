import type { ExtractPropTypes, PropType } from 'vue';
import type { FilePreviewData } from './types';

const FILE_PREVIEW_TYPES = ['mix', 'group'] as const;
const FILE_PREVIEW_SIZES = ['mini', 'small', 'medium', 'large'] as const;

type FilePreviewType = typeof FILE_PREVIEW_TYPES[number];
type FilePreviewSize = typeof FILE_PREVIEW_SIZES[number];

export const props = {
	/**
	 * 数据源：字符串按逗号分隔；数组项为地址或{ source, type?, name?, thumbnail? }
	 */
	data: {
		type: [String, Array] as PropType<FilePreviewData>,
		default: () => []
	},
	/**
	 * 展示方式（与数据项的文件类型type无关）：mix按data顺序混编，group按image/video/audio/file分组
	 */
	type: {
		type: String as PropType<FilePreviewType>,
		default: 'mix',
		validator: (v: string) => FILE_PREVIEW_TYPES.includes(v as any)
	},
	size: {
		type: String as PropType<FilePreviewSize>,
		default: 'medium',
		validator: (v: string) => FILE_PREVIEW_SIZES.includes(v as any)
	},
	vertical: {
		type: Boolean,
		default: false
	},
	/**
	 * 点击是否预览；使用default插槽时由插槽调用preview
	 */
	previewable: {
		type: Boolean,
		default: true
	}
};
export type Props = ExtractPropTypes<typeof props>;
