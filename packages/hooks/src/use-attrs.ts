import { useAttrs as useRawAttrs, computed } from 'vue';
import type { StyleValue, ComputedRef } from 'vue';

type Options = {
	merge?: boolean;
	exclude?: string[];
};

type Attrs = {
	[key: string]: any;
	style?: StyleValue;
	class?: StyleValue;
	attrs?: Record<string, any>;
	listeners?: Record<string, (...args: any[]) => any>;
};

/**
 * Tips:
 * 	1. attrs: 未在emits和props中的值;
 * 	2. inheritAttrs只是取决于是否作用到根节点上
 * @param options ~
 * @returns ~
 */
export const useAttrs = (options?: Options): ComputedRef<Attrs> => {
	const attrs = useRawAttrs();
	const { merge = true, exclude = [] } = options || {};

	return computed(() => {
		if (merge && !exclude.length) return attrs;
		const result = Object.entries(attrs).reduce((pre, [key, val]) => {
			if (exclude.includes(key)) return pre;
			if (!merge && /^on([A-Z])/.test(key)) {
				pre.listeners[key] = val;
			} else if (!merge && /(class|style)/.test(key)) {
				pre[key] = val;
			} else {
				pre.attrs[key] = val;
			}
			return pre;
		}, {
			style: undefined,
			class: undefined,
			attrs: {},
			listeners: {}
		});

		return merge ? result.attrs : result;
	});
};
