import type { CustomerData } from './types';

/**
 * 是否为按值声明类型的内容：必须同时带 type 与 value
 * @param v 待判断的值
 * @returns ~
 */
export const isCustomerData = (v: unknown): v is CustomerData => {
	return !!v && typeof v === 'object' && 'type' in v && 'value' in v;
};

export const isEmpty = (v: unknown) => v === void 0 || v === null || v === '';

/**
 * 取出要渲染的内容：{ type, value } 取 value，字符串与数字取自身，其余（含函数）没有内容
 * @param v 内容
 * @returns ~
 */
export const getCustomerContent = (v: unknown) => {
	return isCustomerData(v) ? v.value : typeof v === 'string' || typeof v === 'number' ? v : void 0;
};

/**
 * 是否有可渲染的内容（函数视为有），与 Customer 的渲染结果一致；用于在没有内容时不创建 Customer
 * @param v 内容
 * @returns ~
 */
export const hasCustomerValue = (v: unknown) => {
	return typeof v === 'function' || !isEmpty(getCustomerContent(v));
};

/**
 * 把函数式调用的参数合成选项对象，两种写法可以混用：
 * - 按位置：method('内容', 3, onClose)，依次对应 orders
 * - 选项对象：放在最后一位，method({ content, duration }) 或 method('内容', { duration })
 * { type, value } 是内容而不是选项对象，按位置取值
 * @param params 调用时传入的参数
 * @param orders 位置参数依次对应的字段
 * @param defaults 默认值，不会被修改
 * @returns ~
 */
export const toOptions = <T extends object>(params: unknown[], orders: Array<keyof T>, defaults: T): T => {
	const result = { ...defaults };
	const last = params.length - 1;
	params.forEach((item, index) => {
		index === last && typeof item === 'object' && !isCustomerData(item)
			? Object.assign(result, item)
			: (result[orders[index]] = item as T[keyof T]);
	});
	return result;
};
