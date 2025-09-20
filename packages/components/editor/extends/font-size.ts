import type Quill from 'quill';
import { toolbarDefaultsMap } from '../default-options';

export const registerFontSize = (editor: typeof Quill) => {
	const Parchment = editor.import('parchment');
	const fontSize = toolbarDefaultsMap['font-size'];
	const SizeClass = new Parchment.ClassAttributor('font-size', 'ql-font-size', {
		scope: Parchment.Scope.INLINE,
		whitelist: fontSize
	});
	const SizeStyle = new Parchment.StyleAttributor('font-size', 'font-size', {
		scope: Parchment.Scope.INLINE,
		whitelist: fontSize
	});
	editor.register({
		'formats/font-size': SizeClass,
		'attributors/class/font-size': SizeClass,
		'attributors/style/font-size': SizeStyle
	}, true);
};
