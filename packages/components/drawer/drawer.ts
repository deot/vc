import { Portal } from '../portal';
import { DrawerView } from './drawer-view.tsx';
import type { Props } from './drawer-view-props';

const Drawer = new Portal(DrawerView, {
	leaveDelay: 0,
	multiple: true
});

type Options = Partial<Props & { onClose: (...args: any[]) => any }>;

export const destroy = () => Drawer.destroy();
export const open = (options: Options) => {
	// 执行弹窗
	const leaf = Drawer.popup({
		...options,
		onFulfilled: options.onClose,
		// 当组件内使用emit('close')，避免重复触发
		onClose: null
	});

	leaf.wrapper!.toggle?.(true);
	return leaf;
};
