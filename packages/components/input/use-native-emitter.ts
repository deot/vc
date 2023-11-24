import type { Ref, SetupContext } from 'vue'; 

export const useNativeEmitter = (
	input: Ref<HTMLElement | undefined>, 
	expose?: SetupContext['expose']
) => {
	const exposed = {
		focus() {
			input.value?.focus?.();
		},
		blur() {
			input.value?.blur?.();
		},
		click() {
			input.value?.click?.();
			exposed.focus();
		}
	};

	expose?.(exposed);
	return exposed;
};