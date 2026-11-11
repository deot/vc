import type { VirtualElement } from '../vc';
import type { FilePreviewItem, FilePreviewItemInput } from './types';
import { normalize, resolveCurrent, resolveTrigger } from './utils';
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
	/**
	 * 同 FilePreview.open 的 triggerElement
	 */
	triggerElement?: Element | VirtualElement | null;
	/**
	 * 同 FilePreview.open 的 placeholder
	 */
	placeholder?: boolean;
	/**
	 * 移动端查看器（MImagePreview.open 使用）：只保留关闭按钮，计数在底部
	 * @internal
	 */
	mobile?: boolean;
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
	open: ({ data, current, triggerElement, placeholder, mobile, onClose }: ImagePreviewOpenOptions = {}) => {
		const list = normalize((data || []).flatMap(toImage));
		const index = resolveCurrent(list, current);
		return openViewer({
			data: list,
			current: index,
			triggerElement: resolveTrigger(triggerElement, list[index]?.element),
			placeholder,
			mobile,
			onClose
		});
	}
};
