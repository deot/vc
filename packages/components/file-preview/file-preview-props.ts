import type { ExtractPropTypes, PropType } from 'vue';
import type { FilePreviewData } from './types';
import { FILE_ITEM_LAYOUTS, FILE_ITEM_SIZES } from './item';
import type { FileItemLayout, FileItemSize } from './item';

export const props = {
	/**
	 * 数据源：字符串按逗号分隔；数组项为地址或{ source, type?, name?, thumbnail? }
	 */
	data: {
		type: [String, Array] as PropType<FilePreviewData>,
		default: () => []
	},
	/**
	 * 布局（与数据项的文件类型 type 无关）：list 整行，grid 方格，group 图片、视频为方格在前，音频、文件为整行在后；
	 * 不传时按数据自动选择：只有图片、视频为 grid，只有音频、文件为 list，两者都有为 group
	 */
	type: {
		type: String as PropType<FileItemLayout>,
		validator: (v: string) => FILE_ITEM_LAYOUTS.includes(v as FileItemLayout)
	},
	size: {
		type: String as PropType<FileItemSize>,
		default: 'medium',
		validator: (v: string) => FILE_ITEM_SIZES.includes(v as FileItemSize)
	},
	/**
	 * 点击是否预览；使用default插槽时由插槽调用preview
	 */
	previewable: {
		type: Boolean,
		default: true
	},
	/**
	 * 图片是否用点中的缩略图垫底、立即放大，大图解码完再换上；为 false 时先淡入蒙层、显示加载中，大图就位后再放大。
	 * 不传时用全局 imageOptions.placeholder，默认 true
	 */
	placeholder: {
		type: Boolean,
		default: undefined
	}
};
export type Props = ExtractPropTypes<typeof props>;
