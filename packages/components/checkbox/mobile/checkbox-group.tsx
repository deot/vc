/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { props as checkboxGroupProps } from '../checkbox-group-props';
import { useCheckboxGroup } from '../use-checkbox-group';

const COMPONENT_NAME = 'vcm-checkbox-group';

export const MCheckboxGroup = defineComponent({
	name: COMPONENT_NAME,
	props: checkboxGroupProps,
	emits: ['update:modelValue', 'change'],
	setup(props, context) {
		const { slots } = context;
		useCheckboxGroup(props, context);
		return () => {
			if (props.fragment) return slots.default?.();
			return (
				<div class="vcm-checkbox-group">
					{ slots?.default?.() }
				</div>
			);
		};
	}
});
