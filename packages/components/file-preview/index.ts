import { FilePreview as FilePreview$ } from './file-preview.tsx';
import { ImagePreview } from './image-preview';
import { open } from './open';
import './style.scss';

export const FilePreview = Object.assign(FilePreview$, { open });

export {
	ImagePreview
};
