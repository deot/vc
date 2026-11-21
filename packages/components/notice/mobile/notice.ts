import { MNoticeView } from './notice-view.tsx';
import { createNotice } from '../create-notice';

export const MNotice = Object.assign(MNoticeView, createNotice(MNoticeView, { mobile: true }));
