import { Portal } from '../portal';
import { ActionSheet } from './mobile/action-sheet.tsx';
import type { ActionSheetAction, Props } from './mobile/action-sheet-props';
import './mobile/style.scss';

type Options = Partial<Props & {
	onOk: (action: ActionSheetAction, index: number) => any;
	onClose: () => any;
}>;

const ActionSheetPortal = new Portal(ActionSheet, {
	leaveDelay: 0,
	multiple: true
});

// await 的结果即 onOk 的参数组成的对象 { value, index }；没有选中就关闭时拒绝
const popup = (options: Options = {}) => {
	const leaf = ActionSheetPortal.popup(options);
	// 给 Portal 内部的 Promise 挂上处理：只用回调时取消不报未处理拒绝，await 的调用方仍会收到拒绝
	leaf.catch(() => {});
	return leaf;
};

const open = popup;
const destroy = () => ActionSheetPortal.destroy();

export const MActionSheet = Object.assign(ActionSheet, {
	open,
	popup,
	destroy
});
