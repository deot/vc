import { onBeforeUnmount } from 'vue';
import type { Nullable } from '@deot/helper-shared';
import type { PortalLeaf } from '../portal/portal-leaf';
import { Popover } from './index';

/**
 * hover 触发的提示弹层（如截断文字的完整内容）
 * 	- 同一时刻只保留一个弹层，打开新的时销毁上一个，组件卸载时销毁；
 * 	- 弹层只监听 triggerEl 的移入 / 移出，调用方须在 triggerEl（或与其重合的容器）移入时调用 open。
 * @returns open / close / isActive / sync
 */
export const useHoverPopover = () => {
	let poper: Nullable<PortalLeaf> = null;
	let trigger: Nullable<Element> = null;

	const close = () => {
		poper && poper.destroy();
		poper = null;
		trigger = null;
	};

	/**
	 * @param triggerEl 触发节点
	 * @returns 该触发节点的弹层是否正在显示
	 */
	const isActive = (triggerEl: Element) => triggerEl === trigger && !!poper?.wrapper?.isActive;

	/**
	 * @param triggerEl 触发节点
	 * @param options 透传给 Popover.open，覆盖默认值
	 */
	const open = (triggerEl: Element, options: Record<string, any> = {}) => {
		// 正在显示时（如从弹层移回触发节点）交由弹层自身的 hover 逻辑处理，不重建，避免闪烁
		if (isActive(triggerEl)) return;
		close();
		trigger = triggerEl;
		poper = Popover.open({
			el: document.body,
			triggerEl,
			hover: true,
			alone: true,
			autoWidth: true,
			placement: 'top',
			...options
		});
	};

	/**
	 * 触发节点被移除时关闭：移除的节点不会再触发 mouseleave，弹层会残留并错位
	 */
	const sync = () => {
		trigger && !trigger.isConnected && close();
	};

	onBeforeUnmount(close);

	return { open, close, isActive, sync };
};
