/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { props as checkboxProps } from './checkbox-props';
import { useCheckbox } from './use-checkbox';
import { Customer } from '../customer';
import { hasCustomerValue } from '../customer/utils';

const COMPONENT_NAME = 'vc-checkbox';

export const Checkbox = defineComponent({
	name: COMPONENT_NAME,
	props: checkboxProps,
	emits: ['update:modelValue', 'change'],
	setup(props, { slots }) {
		const { checked, classes, computedLabel, handleChange, handleFocus, handleBlur } = useCheckbox();
		return () => {
			const label = slots.default || computedLabel.value;
			const hasLabel = hasCustomerValue(label);
			return (
				<label class={[classes.value, 'vc-checkbox']}>
					<span class={[{ 'has-sibling': hasLabel }, 'vc-checkbox__wrapper']}>
						<span class="vc-checkbox__border">
							<span class="vc-checkbox__inner" />
						</span>
						<input
							checked={checked.value}
							name={props.name}
							disabled={props.disabled}
							type="checkbox"
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
