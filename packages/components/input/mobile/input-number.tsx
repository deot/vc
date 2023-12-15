/** @jsxImportSource vue */

import { defineComponent, ref } from 'vue';
import { props as inputNumberProps } from '../input-number-props';

import { MInput } from './input';
import { useInputNumber } from '../use-input-number';
import { useNativeEmitter } from '../use-native-emitter';

const COMPONENT_NAME = 'vcm-input-number';

export const MInputNumber = defineComponent({
	name: COMPONENT_NAME,
	props: inputNumberProps,
	inheritAttrs: false,
	setup(props, { slots, expose, attrs }) {
		const input = ref<any>();
		useNativeEmitter(input, expose);

		const { displayValue, listeners, plusDisabled, minusDisabled, handleStepper } = useInputNumber();

		return () => {
			return (
				<MInput
					ref={input}
					{
						...props
					}
					controllable={true}
					modelValue={displayValue.value}
					class={{ 'vcm-input-number': !props.styleless, 'is-disabled': props.disabled && props.step }}
					{
						...{
							// 包含所有on*都会被绑定, 且listeners中覆盖将由listener内触发（inheritAttrs: false）
							...attrs,
							...listeners,
						}
					}
				>
					{{
						prepend: props.step
							? () => slots.prepend?.() || (
								<span
									class="vcm-input-number__minus"
									// @ts-ignore
									disabled={minusDisabled.value ? 'disabled' : undefined}
									onClick={e => handleStepper(e, -1)}
								/>
								)
							: undefined,
						append: props.step
							? () => slots.append?.() || (
								<span
									class="vcm-input-number__plus"
									// @ts-ignore
									disabled={plusDisabled.value ? 'disabled' : undefined}
									onClick={e => handleStepper(e, 1)}
								/>
								)
							: undefined
					}}
				</MInput>
			);
		};
	}
});
