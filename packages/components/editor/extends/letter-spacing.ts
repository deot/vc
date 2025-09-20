import type Quill from 'quill';
import { toolbarDefaultsMap } from '../default-options';

export const registerLetterSpacing = (quillInstance: typeof Quill) => {
	const Parchment = quillInstance.import('parchment');
	const letterSpacingStyle = new Parchment.ClassAttributor(
		'letter-spacing',
		'ql-letter-spacing',
		{
			scope: Parchment.Scope.INLINE,
			whitelist: toolbarDefaultsMap['letter-spacing']
		}
	);
	quillInstance.register({ 'formats/letter-spacing': letterSpacingStyle }, true);
};
