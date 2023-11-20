import { Portal } from '../portal';
import { ModalView } from './modal-view.tsx';
import type { Props } from './modal-view-props';

const Modal = new Portal(ModalView, {
	leaveDelay: 0,
	multiple: true
});

type Options = Partial<Props & { onClose: (...args: any[]) => any }>;

const create = (mode: Options['mode']) => (options: Options) => {
	// 执行弹窗
	const leaf = Modal.popup({
		...options,
		mode,
		onFulfilled: options.onClose,
		// 当组件内使用emit('close')，避免重复触发
		onClose: null
	});

	leaf.wrapper!.isActive = true;
	return leaf;
};

export const destroy = () => Modal.destroy();
export const info = create('info');
export const success = create('success');
export const warning = create('warning');
export const error = create('error');
