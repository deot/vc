/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import type { SetupContext } from 'vue';
import { props as radioProps } from './radio-props';
import type { Props } from './radio-props';
import { useRadio } from './use-radio';
import { Customer } from '../customer';
import { hasCustomerValue } from '../customer/utils';
import type { RadioGroupType } from './types';

const COMPONENT_NAME = 'vc-radio';

/**
 * Radio 与 RadioButton 共用的渲染
 * @param props ~
 * @param context ~
 * @param options ~
 * @param options.variant 固定的外观，不传时随分组的type
 * @returns 渲染函数
 */
export const useRadioRender = (
	props: Props,
	context: SetupContext<['update:modelValue', 'change']>,
	options: { variant?: RadioGroupType } = {}
) => {
	const { slots } = context;
	const {
		styles,
		radioName,
		checked,
		classes,
		computedLabel,
		isDisabled,
		isPlain,
		handleChange,
		handleFocus,
		handleBlur
	} = useRadio(props, context, options);
	return () => {
		const label = slots.default || computedLabel.value;
		const input = (
			<input
				checked={checked.value}
				name={radioName.value}
				disabled={isDisabled.value}
				type="radio"
				class="vc-radio__input"
				onChange={handleChange}
				onFocus={handleFocus}
				onBlur={handleBlur}
			/>
		);
		// 按钮、胶囊等分组样式：没有圆点，整项即按钮
		if (!isPlain.value) {
			return (
				<label class={[classes.value, 'vc-radio']} style={styles.value}>
					{ input }
					<Customer wrap tag="span" class="vc-radio__label" render={label} />
				</label>
			);
		}
		const hasLabel = hasCustomerValue(label);
		return (
			<label class={[classes.value, 'vc-radio']} style={styles.value}>
				<span class={[{ 'has-sibling': hasLabel }, 'vc-radio__wrapper']}>
					<span class="vc-radio__border">
						<span class="vc-radio__inner" />
					</span>
					{ input }
				</span>
				{ hasLabel && (<Customer tag="span" render={label} />) }
			</label>
		);
	};
};

export const Radio = defineComponent({
	name: COMPONENT_NAME,
	props: radioProps,
	emits: ['update:modelValue', 'change'],
	setup(props, context) {
		return useRadioRender(props, context);
	}
});
