/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { props as radioProps } from '../radio-props';
import { useRadio } from '../use-radio';

const COMPONENT_NAME = 'vcm-radio';

export const MRadio = defineComponent({
	name: COMPONENT_NAME,
	props: radioProps,
	emits: ['update:modelValue', 'change'],
	setup(props, { slots }) {
		const { radioName, checked, classes, computedLabel, handleChange, handleFocus, handleBlur } = useRadio();
		return () => {
			return (
				<label class={[classes.value, 'vcm-radio']}>
					<span class={[{ 'has-sibling': !!(computedLabel.value || slots.default) }, 'vcm-radio__wrapper']}>
						<span class="vcm-radio__border">
							<span class="vcm-radio__inner" />
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
