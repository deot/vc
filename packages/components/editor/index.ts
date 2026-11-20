import { Editor as Editor$ } from './editor.tsx';
import { getMentions } from './extends/mention-blot';
import { EditorView } from './editor-view.tsx';
import '../select/style.scss';
import '../suggest/suggest.scss';
import './style.scss';

export const Editor = Object.assign(Editor$, { getMentions });

export {
	EditorView
};
