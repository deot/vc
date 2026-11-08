/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { props as checkboxGroupProps } from './checkbox-group-props';
import { useCheckboxGroup } from './use-checkbox-group';

const COMPONENT_NAME = 'vc-checkbox-group';

export const CheckboxGroup = defineComponent({
	name: COMPONENT_NAME,
	props: checkboxGroupProps,
	emits: ['update:modelValue', 'change'],
	setup(props, context) {
		const { slots } = context;
		useCheckboxGroup(props, context);
		return () => {
			if (props.styleless) return slots.default?.();
			return (
				<div class="vc-checkbox-group">
					{ slots?.default?.() }
				</div>
			);
		};
	}
});
