/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { props as checkboxProps } from '../checkbox-props';
import { useCheckbox } from '../use-checkbox';
import { MCustomer } from '../../customer/index.m';
import { hasCustomerValue } from '../../customer/utils';

const COMPONENT_NAME = 'vcm-checkbox';

export const MCheckbox = defineComponent({
	name: COMPONENT_NAME,
	props: checkboxProps,
	emits: ['update:modelValue', 'change'],
	setup(props, { slots }) {
		const { checked, classes, computedLabel, handleChange, handleFocus, handleBlur } = useCheckbox();
		return () => {
			const label = slots.default || computedLabel.value;
			const hasLabel = hasCustomerValue(label);
			return (
				<label class={[classes.value, 'vcm-checkbox']}>
					<span class={[{ 'has-sibling': hasLabel }, 'vcm-checkbox__wrapper']}>
						<span class="vcm-checkbox__border">
							<span class="vcm-checkbox__inner" />
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
					{ hasLabel && (<MCustomer tag="span" render={label} />) }
				</label>
			);
		};
	}
});
