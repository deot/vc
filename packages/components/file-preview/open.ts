import { VcInstance } from '../vc';
import type { FilePreviewOpenOptions } from './types';
import { normalize, resolveCurrent } from './utils';
import { getTriggerElement, openViewer } from './viewer';

const isPromise = (value: unknown): value is Promise<unknown> => (
	!!value && typeof (value as Promise<unknown>).then === 'function'
);

// 先交给全局 enhancer。未接管时，图片、视频、音频、文件都进同一个查看器
export const open = (options: FilePreviewOpenOptions) => {
	const triggerElement = getTriggerElement();
	const { instance = null } = options;
	const data = normalize(options.data);
	const current = resolveCurrent(data, options.current);
	const { enhancer } = VcInstance.options.FilePreview || {};

	const launch = () => openViewer({
		data,
		current,
		instance,
		triggerElement,
		onClose: options.onClose
	});

	if (typeof enhancer !== 'function') return launch();

	const taken = enhancer({ current, data, instance });
	// Promise 不能直接 resolve 成 PortalLeaf，否则会等到预览关闭才结束
	if (isPromise(taken)) {
		return taken.then((value) => {
			if (value) return;
			const leaf = launch();
			if (!leaf) return;
			return {
				destroy: () => leaf.destroy(),
				target: leaf.target
			};
		});
	}
	if (taken) return;
	return launch();
};
