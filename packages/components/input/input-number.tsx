/** @jsxImportSource vue */

import { defineComponent, ref } from 'vue';
import { props as inputNumberProps } from './input-number-props';

import { Icon } from '../icon/index';
import { Input } from './input';
import { useInputNumber } from './use-input-number';
import { useNativeEmitter } from './use-native-emitter';

const COMPONENT_NAME = 'vc-input-number';

export const InputNumber = defineComponent({
	name: COMPONENT_NAME,
	props: inputNumberProps,
	inheritAttrs: false,
	setup(props, { slots, expose, attrs }) {
		const input = ref<any>();
		const { displayValue, listeners, plusDisabled, minusDisabled, handleStepper } = useInputNumber();

		useNativeEmitter(input, expose);
		return () => {
			return (
				<Input
					ref={input}
					{
						...props
					}
					controllable={true}
					modelValue={displayValue.value}
					class={{ 'vc-input-number': !props.styleless }}
					{
						...{
							// 包含所有on*都会被绑定, 且listeners中覆盖将由listener内触发（inheritAttrs: false）
							...attrs,
							...listeners,
						}
					}
				>
					{{
						prepend: slots.prepend && (() => slots.prepend?.()),
						append: props.step
							? (
									slots.append
										? () => slots.append?.()
										: () => {
												return (
													<div class="vc-input-number__icon">
														<div
															class="vc-input-number__up"
															// @ts-ignore
															disabled={plusDisabled.value ? 'disabled' : undefined}
															onClick={e => handleStepper(e, 1)}
														>
															<Icon type="up" />
														</div>
														<div
															class="vc-input-number__down"
															// @ts-ignore
															disabled={minusDisabled.value ? 'disabled' : undefined}
															onClick={e => handleStepper(e, -1)}
														>
															<Icon type="down" />
														</div>
													</div>
												);
											}
								)
							: undefined
					}}
				</Input>
			);
		};
	}
});
