import { Portal } from '../portal';
import { Upload } from './upload';

const Upload$ = new Portal(Upload, {
	leaveDelay: 0
});

export const open = (options: any) => {
	const { slient = false, ...rest } = options;
	const originalOnComplete = rest.onComplete || (() => {});
	const leaf = Upload$.popup({
		...rest,
		onComplete: async (e: any) => {
			originalOnComplete(e);
			if (e.total === e.error) {
				leaf.reject(e);
			} else {
				leaf.resolve(e);
			}
		}
	});
	!slient && leaf.wrapper?.click();

	return leaf;
};
