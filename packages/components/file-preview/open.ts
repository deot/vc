import { VcInstance } from '../vc';
import type { FilePreviewOpenOptions } from './types';
import { normalize, resolveCurrent, resolveTrigger } from './utils';
import { openViewer } from './viewer';

const isPromise = (value: unknown): value is Promise<unknown> => (
	!!value && typeof (value as Promise<unknown>).then === 'function'
);

// 先交给全局 enhancer。未接管时，图片、视频、音频、文件都进同一个查看器
export const open = (options: FilePreviewOpenOptions) => {
	const { instance = null, placeholder, onClose } = options;
	const data = normalize(options.data);
	const current = resolveCurrent(data, options.current);
	// 调用时就取：enhancer 返回 Promise 时，之后可能又有别的点击
	const triggerElement = resolveTrigger(options.triggerElement, data[current]?.element);
	const { enhancer } = VcInstance.options.FilePreview || {};

	const launch = () => openViewer({
		data,
		current,
		instance,
		triggerElement,
		placeholder,
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
