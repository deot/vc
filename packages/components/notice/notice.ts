import { NoticeView } from './notice-view.tsx';
import { createNotice } from './create-notice';

export const Notice = Object.assign(NoticeView, createNotice(NoticeView));
