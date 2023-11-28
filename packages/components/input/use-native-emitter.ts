import type { Ref, SetupContext } from 'vue'; 

// 原生事件需要页面触发click事件的回调里使用，否则它将无效（安全机制）
export const useNativeEmitter = (
	input: Ref<HTMLElement | undefined>, 
	expose?: SetupContext['expose']
) => {
	const exposed = {
		/* istanbul ignore next -- @preserve */ 
		focus() {
			input.value?.focus?.();
		},
		/* istanbul ignore next -- @preserve */ 
		blur() {
			input.value?.blur?.();
		},
		/* istanbul ignore next -- @preserve */ 
		click() {
			input.value?.click?.();
			exposed.focus();
		}
	};

	expose?.(exposed);
	return exposed;
};