import { Portal } from '../portal';
import { Upload } from './upload';

const Upload$ = new Portal(Upload, {
	leaveDelay: 0
});

// 直传 TODO: 集成Loading
export const open = async (options: any) => {
	const originalOnComplete = options.onComplete || (() => {});
	const leaf = Upload$.popup({
		...options,
		onComplete: async (e: any) => {
			originalOnComplete(e);
			if (e.total === e.error) {
				leaf.reject(e);
			} else {
				leaf.resolve(e);
			}
		}
	});
	leaf.wrapper?.click();

	return leaf;
};
