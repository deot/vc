import { VcInstance } from '../vc';
import type { FilePreviewItem, FilePreviewItemInput } from './types';
import { normalize } from './utils';
import { openViewer } from './viewer';

type ImageInput = string | (Partial<FilePreviewItem> & {
	// 兼容旧数据的地址字段，优先级 value > source > src
	value?: string;
	src?: string;
	width?: number;
	height?: number;
});

export type ImagePreviewOpenOptions = {
	data?: ImageInput[];
	current?: number;
	onClose?: () => void;
};

const toImage = (input: ImageInput): FilePreviewItemInput[] => {
	if (typeof input === 'string') return [{ source: input.trim(), type: 'image' }];
	if (!input) return [];
	const { value, src, ...rest } = input;
	return [{ ...rest, source: value || rest.source || src || '', type: 'image' }];
};

// 不经过 FilePreview.enhancer，避免和图片组件互相引用
export const ImagePreview = {
	open: (options: ImagePreviewOpenOptions = {}) => openViewer({
		data: normalize((options.data || []).flatMap(toImage)),
		current: options.current,
		triggerElement: VcInstance.getTriggerElement(),
		onClose: options.onClose
	})
};
