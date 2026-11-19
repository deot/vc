import type Quill from 'quill';
import { registerStyleAttributor } from './style-attributor';

// 字间距作用于选中文字
export const registerLetterSpacing = (QuillClass: typeof Quill, values?: string[]) => {
	registerStyleAttributor(QuillClass, 'letter-spacing', 'INLINE', values);
};
