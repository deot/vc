import { defineComponent, inject, getCurrentInstance, onMounted, onBeforeUnmount } from 'vue';
import { props as tourStepProps } from './tour-step-props';
import type { TourProvide, TourStepDeclaration } from './types';

const COMPONENT_NAME = 'vc-tour-step';

export const TourStep = defineComponent({
	name: COMPONENT_NAME,
	props: tourStepProps,
	emits: ['close'],
	setup(props, { slots, emit }) {
		const tour = inject<TourProvide | null>('vc-tour', null);
		const instance = getCurrentInstance()!;
		const step: TourStepDeclaration = {
			options: props,
			slots,
			onClose: context => emit('close', context),
			getNode: () => instance.vnode.el as Node | null
		};

		onMounted(() => tour?.add(step));
		onBeforeUnmount(() => tour?.remove(step));
		return () => null;
	}
});
