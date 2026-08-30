import { MToast } from '../toast/index.m';
import { createOpen } from './open';
import { createUpload } from './upload';
import './style.scss';

const MUpload$ = createUpload({
	error: (message, duration) => MToast.info(message, duration),
	loading: message => MToast.loading(message)
});

export const MUpload = Object.assign(MUpload$, {
	open: createOpen(MUpload$, 'vcm-upload')
});
