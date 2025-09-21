import type Quill from 'quill';
import { registerVideoBlot } from './video-blot';
import { registerAudioBlot } from './audio-blot';
import { registerLineHeight } from './line-height';
import { registerLetterSpacing } from './letter-spacing';
import { registerEventModule } from './event-module';
import { registerFontSize } from './font-size';

export { EXTENDS_CONTEXT_KEY } from './constant';
export { uploadFile, insertFile } from './event-module';

export const registerExtends = (e: typeof Quill) => {
	registerEventModule(e);
	registerVideoBlot(e);
	registerAudioBlot(e);
	registerLineHeight(e);
	registerLetterSpacing(e);
	registerFontSize(e);
};
