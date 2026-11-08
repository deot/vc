/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { props as radioGroupProps } from '../radio-group-props';
import { useRadioGroup } from '../use-radio-group';

const COMPONENT_NAME = 'vcm-radio-group';

export const MRadioGroup = defineComponent({
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
					class={[classes.value, 'vcm-radio-group']}
					// @ts-ignore
					name={props.name}
				>
					{ slots?.default?.() }
				</div>
			);
		};
	}
});
