import type Quill from 'quill';
import { registerVideoBlot } from './video-blot';
import { registerAudioBlot } from './audio-blot';
import { registerLineHeight } from './line-height';
import { registerLetterSpacing } from './letter-spacing';
import { registerEventModule } from './event-module';
import { registerFontSize } from './font-size';
import { registerMentionBlot } from './mention-blot';
import { getToolbarValues } from './style-attributor';

export { EXTENDS_CONTEXT_KEY } from './constant';
export { uploadFile, insertFile } from './event-module';
export { getMentions } from './mention-blot';
export type { MentionValue } from './mention-blot';

/**
 * 注册扩展；toolbar 里自定义的字号、行高、字间距并入对应格式的白名单
 * @param e Quill 构造器
 * @param toolbar options.toolbar
 */
export const registerExtends = (e: typeof Quill, toolbar?: any) => {
	registerEventModule(e);
	registerVideoBlot(e);
	registerAudioBlot(e);
	registerMentionBlot(e);
	registerLineHeight(e, getToolbarValues(toolbar, 'line-height'));
	registerLetterSpacing(e, getToolbarValues(toolbar, 'letter-spacing'));
	registerFontSize(e, getToolbarValues(toolbar, 'font-size'));
};
