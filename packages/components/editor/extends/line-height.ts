import type Quill from 'quill';
import { registerStyleAttributor } from './style-attributor';

// 行高作用于整段：加在行内元素上只能撑高、不能压低
export const registerLineHeight = (QuillClass: typeof Quill, values?: string[]) => {
	registerStyleAttributor(QuillClass, 'line-height', 'BLOCK', values);
};
