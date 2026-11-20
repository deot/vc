import { MEditor as MEditor$ } from './mobile/editor.tsx';
import { getMentions } from './extends/mention-blot';
import { MEditorView } from './mobile/editor-view.tsx';
import '../select/style.scss';
import '../suggest/suggest.scss';
import '../suggest/mobile.scss';
import './style.scss';
import './mobile/style.scss';

export const MEditor = Object.assign(MEditor$, { getMentions });

export {
	MEditorView
};
