import { VcInstance } from '../vc';
import type { FilePreviewOpenOptions } from './types';
import { normalize, resolveCurrent } from './utils';
import { openViewer } from './viewer';

const isPromise = (value: unknown): value is Promise<unknown> => (
	!!value && typeof (value as Promise<unknown>).then === 'function'
);

// 先交给全局 enhancer。未接管时，图片、视频、音频、文件都进同一个查看器
export const open = (options: FilePreviewOpenOptions) => {
	const { instance = null, onClose } = options;
	const data = normalize(options.data);
	const current = resolveCurrent(data, options.current);
	const { enhancer } = VcInstance.options.FilePreview || {};

	// 真正打开查看器时才取那次点击：enhancer 接管时留给它自己打开的弹层
	const launch = () => openViewer({
		data,
		current,
		instance,
		triggerElement: VcInstance.getTriggerElement(),
		onClose
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
