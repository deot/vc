import { Portal } from '../../portal';
import { MModalView } from './modal-view.tsx';
import type { Props } from './modal-view-props';

const MModal$ = new Portal(MModalView, {
	multiple: true
});

type Options = Partial<Props & { onClose: (...args: any[]) => any }>;

const create = (mode: Options['mode']) => (options: Options) => {
	// 执行弹窗
	const leaf = MModal$.popup({
		...options,
		mode,
		onFulfilled: options.onClose,
		// 当组件内使用emit('close')，避免重复触发
		onClose: null
	});

	leaf.wrapper!.toggle?.(true);
	return leaf;
};

export const destroy = () => MModal$.destroy();
export const alert = create('alert');
export const operation = create('operation');

export const MModal = Object.assign(MModalView, { destroy, alert, operation });
