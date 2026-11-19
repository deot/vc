import type { Component } from 'vue';

/**
 * 移动端替换的组件与方法：由 mobile/ 下的入口传入，桌面端不引入移动端代码
 */
export type EditorComponents = {
	// 选择项：动作面板
	ActionSheet: { open: (options: Record<string, any>) => any };
	// 颜色、链接输入：底部弹出层；open 返回的实例通过 wrapper.toggle(false) 关闭
	Popup: { open: (options: Record<string, any>) => any };
	Input: Component;
	Button: Component;
	// 图片预览
	ImagePreview: { open: (options: Record<string, any>) => any };
};
