/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { props as radioProps } from './radio-props';
import { useRadio } from './use-radio';

const COMPONENT_NAME = 'vc-radio-button';

export const RadioButton = defineComponent({
	name: COMPONENT_NAME,
	props: {
		...radioProps,
		labelStyle: [String, Object],
		labelClass: [String, Object],
	},
	emits: ['update:modelValue', 'change'],
	setup(props, { slots }) {
		const {  styles, radioName, checked, classes, computedLabel, isDisabled, handleChange, handleFocus, handleBlur } = useRadio();
		return () => {
			return (
				<label class={[classes.value, 'vc-radio-button']} style={styles.value}>
					<input
						checked={checked.value}
						name={radioName.value}
						disabled={isDisabled.value}
						type="radio"
						onChange={handleChange}
						onFocus={handleFocus}
						onBlur={handleBlur}
					/>
					<span class={[props.labelClass, 'vc-radio-button__label']} style={props.labelStyle}>
						{
							slots.default ? slots.default() : (computedLabel.value || '')
						}
					</span>
				</label>
			);
		};
	}
});
