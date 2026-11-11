import { MFilePreview as MFilePreview$ } from './mobile/file-preview.tsx';
import { ImagePreview } from './image-preview';
import { open as open$ } from './open';
import type { FilePreviewOpenOptions } from './types';
import type { ImagePreviewOpenOptions } from './image-preview';
import './item/style.scss';
import './style.scss';
import './item/mobile.scss';
import './mobile/style.scss';

// 打开移动端查看器：只保留关闭按钮，计数在底部
const open = (options: FilePreviewOpenOptions) => open$({ ...options, mobile: true });

export const MFilePreview = Object.assign(MFilePreview$, { open });

export const MImagePreview = {
	open: (options: ImagePreviewOpenOptions = {}) => ImagePreview.open({ ...options, mobile: true })
};
