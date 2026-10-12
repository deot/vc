/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { props as radioProps } from './radio-props';
import { useRadio } from './use-radio';
import { Customer } from '../customer';
import { hasCustomerValue } from '../customer/utils';

const COMPONENT_NAME = 'vc-radio';

export const Radio = defineComponent({
	name: COMPONENT_NAME,
	props: radioProps,
	emits: ['update:modelValue', 'change'],
	setup(props, { slots }) {
		const { styles, radioName, checked, classes, computedLabel, isDisabled, handleChange, handleFocus, handleBlur } = useRadio();
		return () => {
			const label = slots.default || computedLabel.value;
			const hasLabel = hasCustomerValue(label);
			return (
				<label class={[classes.value, 'vc-radio']} style={styles.value}>
					<span class={[{ 'has-sibling': hasLabel }, 'vc-radio__wrapper']}>
						<span class="vc-radio__border">
							<span class="vc-radio__inner" />
						</span>
						<input
							checked={checked.value}
							name={radioName.value}
							disabled={isDisabled.value}
							type="radio"
							onChange={handleChange}
							onFocus={handleFocus}
							onBlur={handleBlur}
						/>
					</span>
					{ hasLabel && (<Customer tag="span" render={label} />) }
				</label>
			);
		};
	}
});
