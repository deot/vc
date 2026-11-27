import { VcInstance } from '../vc';

/**
 * 所有弹层的默认挂载点：VcInstance.options.Portal.element，缺省为 body
 * 命令式（Portal）、声明式 Teleport（Popover、MDropdown、PortalView…）与自建容器（Notice）都跟随它；组件上显式传的 to / element 仍然优先
 * @returns 选择器或元素，可直接作为 Teleport 的 to
 */
export const getPortalElement = (): string | HTMLElement => {
	return (VcInstance.options as any).Portal?.element || 'body';
};

/**
 * 解析为元素：选择器找不到或没有 DOM 时回退 body
 * @returns 挂载点元素
 */
export const resolvePortalElement = (): HTMLElement => {
	const element = getPortalElement();
	if (typeof element !== 'string') return element;
	return (typeof document !== 'undefined' && document.querySelector<HTMLElement>(element)) || document.body;
};
