// jsdom 不做布局：刷新提示条沿主轴的尺寸（也是触发刷新的拉动距离）由这里给出，默认与桌面端样式一致
const state = { size: 30 };

(['offsetHeight', 'offsetWidth'] as const).forEach((prop) => {
	const { get } = Object.getOwnPropertyDescriptor(HTMLElement.prototype, prop)!;
	Object.defineProperty(HTMLElement.prototype, prop, {
		configurable: true,
		get(this: HTMLElement) {
			return this.classList.contains('vc-recycle-list__pull') ? state.size : get!.call(this);
		}
	});
});

/**
 * 改变提示条的尺寸
 * @param size 沿主轴的尺寸（px）
 * @returns 恢复为默认值
 */
export const mockPullSize = (size: number) => {
	state.size = size;
	return () => {
		state.size = 30;
	};
};
