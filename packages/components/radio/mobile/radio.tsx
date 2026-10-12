/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { props as radioProps } from '../radio-props';
import { useRadio } from '../use-radio';
import { MCustomer } from '../../customer/index.m';
import { hasCustomerValue } from '../../customer/utils';

const COMPONENT_NAME = 'vcm-radio';

export const MRadio = defineComponent({
	name: COMPONENT_NAME,
	props: radioProps,
	emits: ['update:modelValue', 'change'],
	setup(props, { slots }) {
		const { styles, radioName, checked, classes, computedLabel, isDisabled, handleChange, handleFocus, handleBlur } = useRadio();
		return () => {
			const label = slots.default || computedLabel.value;
			const hasLabel = hasCustomerValue(label);
			return (
				<label class={[classes.value, 'vcm-radio']} style={styles.value}>
					<span class={[{ 'has-sibling': hasLabel }, 'vcm-radio__wrapper']}>
						<span class="vcm-radio__border">
							<span class="vcm-radio__inner" />
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
					{ hasLabel && (<MCustomer tag="span" render={label} />) }
				</label>
			);
		};
	}
});
