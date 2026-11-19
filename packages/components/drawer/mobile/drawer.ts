import { Portal } from '../../portal';
import { MDrawerView } from './drawer-view.tsx';
import type { Props } from './drawer-view-props';

const MDrawer$ = new Portal(MDrawerView, {
	leaveDelay: 0,
	multiple: true
});

type Options = Partial<Props & { onClose: (...args: any[]) => any }>;

export const destroy = () => MDrawer$.destroy();
export const open = (options: Options) => {
	const leaf = MDrawer$.popup({
		...options,
		onFulfilled: options.onClose,
		// 当组件内使用emit('close')，避免重复触发
		onClose: null
	});

	leaf.wrapper!.toggle?.(true);
	return leaf;
};

export const MDrawer = Object.assign(MDrawerView, { open, destroy });
