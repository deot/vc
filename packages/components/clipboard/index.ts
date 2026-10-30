import { Clipboard as Clipboard$ } from './clipboard';
import { group } from './utils';

export type { ClipboardValue } from './utils';
export const Clipboard = Object.assign(Clipboard$, group);
