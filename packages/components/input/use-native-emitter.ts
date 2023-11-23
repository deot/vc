import type { Ref } from 'vue'; 

export const useNativeEmitter = (input: Ref<HTMLElement | undefined>) => {
	return {
		focus() {
			input.value?.focus?.();
		},
		blur() {
			input.value?.blur?.();
		},
		click() {
			input.value?.click?.();
			this.focus();
		}
	};
};