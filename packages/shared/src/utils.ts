import { IS_SERVER } from './constants';

export const autoCatch = async (impl: any, options: Record<string, any> = {}) => {
	const { onError = console.error } = options;

	let target = impl;
	typeof target === 'function' && (target = target());

	try {
		const e = await target;
		return e;
	} catch (e) {
		onError(e);
	}
};

interface Exceptions {
	id?: RegExp;
	className?: RegExp;
	tagName?: RegExp;
}

// 当前节点是否符合条件
export const eleInRegExp = (el: HTMLElement, exceptions: Exceptions): boolean => {
	for (const i in exceptions) {
		if (exceptions[i].test(el[i])) {
			return true;
		}
	}
	return false;
};

/**
 * 合并字符串和对象为一个新的对象, 如
 * args = ['', 0];
 * orders = ['message','duration'];
 * ->
 * {
 * 	message: args[0],
 * 	duration: args[1]
 * }
 * @param args ~
 * @param orders ~
 * @param original ~
 * @returns ~
 */
export const toOptions = <T>(args: any[], orders: Array<keyof T>, original?: T): T => {
	let result = original || ({} as T);
	args.map((item, index) => {
		if (typeof item === 'object' && args.length === index + 1) {
			result = {
				...result,
				...item
			};
		} else {
			result[orders[index] as any] = item;
		}
		return true;
	});
	return result;
};

export const getComputedStyle = (el: HTMLElement, SIZING_STYLE: string[]) => {
	// 注: 服务端渲染为0, 在客服端激活前，展示端存在问题【高度不定】
	if (IS_SERVER) return {};
	const style = window.getComputedStyle(el);

	const boxSizing = style.getPropertyValue('box-sizing')
		|| style.getPropertyValue('-moz-box-sizing')
		|| style.getPropertyValue('-webkit-box-sizing');

	const paddingSize = parseFloat(style.getPropertyValue('padding-bottom'))
		+ parseFloat(style.getPropertyValue('padding-top'));

	const borderSize = parseFloat(style.getPropertyValue('border-bottom-width'))
		+ parseFloat(style.getPropertyValue('border-top-width'));

	const sizingStyle = SIZING_STYLE
		.map(key => `${key}:${style.getPropertyValue(key)}`)
		.join(';');

	return {
		sizingStyle,
		paddingSize,
		borderSize,
		boxSizing,
	};
};
