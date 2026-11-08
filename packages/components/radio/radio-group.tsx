/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { props as radioGroupProps } from './radio-group-props';
import { useRadioGroup } from './use-radio-group';

const COMPONENT_NAME = 'vc-radio-group';

export const RadioGroup = defineComponent({
	name: COMPONENT_NAME,
	props: radioGroupProps,
	emits: ['update:modelValue', 'change'],
	setup(props, context) {
		const { slots } = context;
		const { classes } = useRadioGroup(props, context);
		return () => {
			if (props.styleless) return slots.default?.();
			return (
				<div
					class={[classes.value, 'vc-radio-group']}
					// @ts-ignore
					name={props.name}
				>
					{ slots?.default?.() }
				</div>
			);
		};
	}
});
