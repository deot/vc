/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { props as checkboxProps } from './checkbox-props';
import { useCheckbox } from './use-checkbox';

const COMPONENT_NAME = 'vc-checkbox';

export const Checkbox = defineComponent({
	name: COMPONENT_NAME,
	props: checkboxProps,
	emits: ['update:modelValue', 'change'],
	setup(props, { slots }) {
		const { checked, classes, computedLabel, handleChange, handleFocus, handleBlur } = useCheckbox();
		return () => {
			return (
				<label class={[classes.value, 'vc-checkbox']}>
					<span class={[{ 'has-sibling': !!(computedLabel.value || slots.default) }, 'vc-checkbox__wrapper']}>
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
					{
						slots.default ? slots.default() : (computedLabel.value && <span>{computedLabel.value}</span>)
					}
				</label>
			);
		};
	}
});
