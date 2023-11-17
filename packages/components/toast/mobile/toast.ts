import { Utils } from '@deot/vc-shared';
import { Portal } from '../../portal';
import { MToastView } from './toast-view.tsx';
import type { Props } from './toast-view-props';

const MToast = new Portal(MToastView, {
	multiple: true,
	autoDestroy: false
});

type Options = Partial<Props & { onClose: (...args: any[]) => any }>;

const create = (options: Options) => (...params: Array<Options[keyof Options] | Options>) => {
	let options$ = Utils.toOptions(
		params, 
		['content', 'duration', 'onClose', 'maskClosable'],
		options
	);

	// 执行弹窗
	return MToast.popup({
		...options,
		onFulfilled: options$.onClose,
		onClose: null
	});
};

export const destroy = () => MToast.destroy();
export const info = create({ mode: 'info' });
export const success = create({ mode: 'success' });
export const loading = create({ mode: 'loading', duration: 0, maskClosable: false });
export const warning = create({ mode: 'warning' });
export const error = create({ mode: 'error' });
