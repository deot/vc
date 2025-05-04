/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { props as radioGroupProps } from './radio-group-props';
import { useRadioGroup } from './use-radio-group';

const COMPONENT_NAME = 'vc-radio-group';

export const RadioGroup = defineComponent({
	name: COMPONENT_NAME,
	props: radioGroupProps,
	emits: ['update:modelValue', 'change'],
	setup(props, { slots }) {
		const { classes } = useRadioGroup();
		return () => {
			if (props.fragment) return slots.default?.();
			return (
				<div
					class="vc-radio-group"
					style={classes.value}
					// @ts-ignore
					name={props.name}
				>
					{ slots?.default?.() }
				</div>
			);
		};
	}
});
