import type Quill from 'quill';
import { toolbarDefaultsMap } from '../default-options';

export const registerLineHeight = (quillInstance: typeof Quill) => {
	const lineHeight = toolbarDefaultsMap['line-height'];
	const Parchment = quillInstance.import('parchment');
	const lineHeightStyle = new Parchment.StyleAttributor(
		'line-height',
		'line-height',
		{ scope: Parchment.Scope.INLINE, whitelist: lineHeight }
	);

	quillInstance.register({ 'formats/line-height': lineHeightStyle }, true);
};
