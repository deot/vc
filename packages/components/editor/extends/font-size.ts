import type Quill from 'quill';
import { registerStyleAttributor } from './style-attributor';

// 字号作用于选中文字
export const registerFontSize = (QuillClass: typeof Quill, values?: string[]) => {
	registerStyleAttributor(QuillClass, 'font-size', 'INLINE', values);
};
