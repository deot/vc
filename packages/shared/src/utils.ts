import type { Options } from './global.types';

export const autoCatch = async (impl: any, options: Options = {}) => { 
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
	for (let i in exceptions) {
		if (exceptions[i].test(el[i])) {
			return true;
		}
	}
	return false;
};