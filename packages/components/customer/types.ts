import type { SetupContext } from 'vue';

/**
 * 按值声明类型的内容：html 按 HTML 渲染，text 及其它类型按文本渲染
 */
export type CustomerData = {
	type: string;
	value: any;
};

/**
 * 渲染函数（插槽也是函数）：第一个参数是写在 Customer 上的其他属性（class / style / 事件监听与 tag / wrap 除外）
 */
export type CustomerRender = (attrs: Record<string, any>, context: SetupContext) => any;

export type CustomerValue = string | number | boolean | CustomerRender | CustomerData | null;
