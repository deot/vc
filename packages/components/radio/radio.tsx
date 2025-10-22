/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { props as radioProps } from './radio-props';
import { useRadio } from './use-radio';

const COMPONENT_NAME = 'vc-radio';

export const Radio = defineComponent({
	name: COMPONENT_NAME,
	props: radioProps,
	emits: ['update:modelValue', 'change'],
	setup(props, { slots }) {
		const { styles, radioName, checked, classes, computedLabel, handleChange, handleFocus, handleBlur } = useRadio();
		return () => {
			return (
				<label class={[classes.value, 'vc-radio']} style={styles.value}>
					<span class={[{ 'has-sibling': !!(computedLabel.value || slots.default) }, 'vc-radio__wrapper']}>
						<span class="vc-radio__border">
							<span class="vc-radio__inner" />
						</span>
						<input
							checked={checked.value}
							name={radioName.value}
							disabled={props.disabled}
							type="radio"
							onChange={handleChange}
							onFocus={handleFocus}
							onBlur={handleBlur}
						/>
					</span>
					{
						slots.default ? slots.default() : (computedLabel.value && <span>{computedLabel.value}</span>)
					}
				</label>
			);
		};
	}
});
