import { Portal } from '../portal';
import { MPopup as Popup$ } from './mobile/popup';
import type { Props } from './mobile/popup-props';
import './mobile/style.scss';

const PopupPortal = new Portal(Popup$, {
	leaveDelay: 0,
	multiple: true
});

type Options = Partial<Props & { onClose: (...args: any[]) => any }> & Record<string, any>;

/**
 * 以 Portal 打开弹出层，参数同 MPopup 的属性；内容用 content（Customer），onClose 在离场动画结束后触发
 * @param options ~
 * @returns PortalLeaf
 */
const open = (options: Options = {}) => {
	const leaf = PopupPortal.popup({
		...options,
		onFulfilled: options.onClose,
		// 组件内 emit('close') 时避免重复触发
		onClose: null
	});

	leaf.wrapper!.toggle?.(true);
	return leaf;
};

const destroy = () => PopupPortal.destroy();

export const MPopup = Object.assign(Popup$, { open, destroy });
