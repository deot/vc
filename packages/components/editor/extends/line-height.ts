import type Quill from 'quill';
import { toolbarDefaultsMap } from '../default-options';

export const registerLineHeight = (quillInstance: typeof Quill) => {
	const lineHeight = toolbarDefaultsMap['line-height'];
	// 设置的样式1.2为class不起由于有.不生效, 默认扩大十倍
	const whitelist = lineHeight.map((i: any) => String(+i * 10));

	const Parchment = quillInstance.import('parchment');
	const lineHeightStyle = new Parchment.ClassAttributor(
		'line-height',
		'ql-line-height',
		{ scope: Parchment.Scope.INLINE, whitelist }
	);

	quillInstance.register({ 'formats/line-height': lineHeightStyle }, true);
};
