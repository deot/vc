/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { props as radioProps } from './radio-props';
import { useRadio } from './use-radio';

const COMPONENT_NAME = 'vc-radio-button';

export const RadioButton = defineComponent({
	name: COMPONENT_NAME,
	props: {
		...radioProps,
		gap: {
			type: Number,
			default: 4
		}
	},
	emits: ['update:modelValue', 'change'],
	setup(props, { slots }) {
		const { styles, radioName, checked, classes, computedLabel, handleChange, handleFocus, handleBlur } = useRadio();
		return () => {
			return (
				<label class={[classes.value, 'vc-radio-button']} style={styles.value}>
					<input
						checked={checked.value}
						name={radioName.value}
						disabled={props.disabled}
						type="radio"
						onChange={handleChange}
						onFocus={handleFocus}
						onBlur={handleBlur}
					/>
					{
						slots.default ? slots.default() : (computedLabel.value && <span>{computedLabel.value}</span>)
					}
				</label>
			);
		};
	}
});
