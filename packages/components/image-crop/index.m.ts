import { MImageCrop as MImageCropView } from './mobile/image-crop.tsx';
import { open } from './mobile/open';
import './style.scss';
import './mobile/style.scss';

export const MImageCrop = Object.assign(MImageCropView, { open });
