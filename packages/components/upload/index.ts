import { Message } from '../message';
import { createOpen } from './open';
import { createUpload } from './upload';
import './style.scss';

const Upload$ = createUpload({
	error: (message, duration) => Message.error(message, duration),
	loading: message => Message.loading(message)
});

export const Upload = Object.assign(Upload$, {
	open: createOpen(Upload$, 'vc-upload')
});
