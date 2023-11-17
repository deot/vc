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
	for (let i in exceptions) {
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
