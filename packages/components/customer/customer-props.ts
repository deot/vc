import type { Component, PropType } from 'vue';
import type { CustomerRender, CustomerValue } from './types';

// 各组件的标题、内容等属性共用：字符串 / 数字 / 渲染函数 / { type, value }
export const valueType = [String, Number, Function, Object] as PropType<Exclude<CustomerValue, boolean>>;

// 同上，另外接受布尔值（视为没有内容）；String 在 Boolean 之前：空字符串不会被转成 true
export const valueOrBooleanType = [String, Number, Boolean, Function, Object] as PropType<CustomerValue>;

// 只接受函数的 render* 属性共用
export const renderType = Function as PropType<CustomerRender>;

// 只声明 render：声明的属性每次更新都要经响应式代理读写，tag / wrap 这类开关按约定从 attrs 读取
export const props = {
	render: valueOrBooleanType
};

export type Props = {
	render?: CustomerValue;
	// 包裹元素，默认 div
	tag?: string | Component;
	// 函数的内容也放进包裹元素，且没有内容时仍渲染包裹元素
	wrap?: boolean;
};
