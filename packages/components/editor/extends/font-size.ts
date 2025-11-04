import type Quill from 'quill';
import { toolbarDefaultsMap } from '../default-options';

export const registerFontSize = (editor: typeof Quill) => {
	const Parchment = editor.import('parchment');
	const fontSize = toolbarDefaultsMap['font-size'];
	const SizeStyle = new Parchment.StyleAttributor('font-size', 'font-size', {
		scope: Parchment.Scope.INLINE,
		whitelist: fontSize
	});
	editor.register({
		'formats/font-size': SizeStyle
	}, true);
};
