import { MClipboard as Clipboard$ } from './mobile/clipboard';
import { group } from './utils';

export const MClipboard = Object.assign(Clipboard$, group);
