import { VcInstance } from '../vc';
import { ImagePreview } from './image-preview';
import { VideoPreview } from './preview/video';
import { AudioPreview } from './preview/audio';
import { normalize } from './utils';
import type { FilePreviewOpenOptions } from './types';

// 先交给全局enhancer，未接管时按文件类型走内置预览
export const open = async (options: FilePreviewOpenOptions) => {
	const { current = 0, instance = null } = options;
	const data = normalize(options.data);
	const item = data[current];
	if (!item) return;

	const { enhancer } = VcInstance.options.FilePreview || {};
	if (typeof enhancer === 'function' && await enhancer({ current, data, instance })) return;

	switch (item.type) {
		case 'image': {
			const images = data.filter(i => i.type === 'image');
			ImagePreview.open({
				current: images.indexOf(item),
				data: images.map(i => i.source)
			});
			return;
		}
		case 'video':
			VideoPreview.popup({ src: item.source });
			return;
		case 'audio':
			AudioPreview.popup({ src: item.source });
			return;
		default:
			window.open(item.source, '_blank', 'noopener');
	}
};
