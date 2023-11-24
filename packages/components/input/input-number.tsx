/** @jsxImportSource vue */

import { defineComponent, ref } from 'vue';
import { props as inputNumberProps } from './input-number-props';

import { Icon } from '../icon/index';
import { Input } from './input';
import { useInputNumber } from './use-input-number';
import { useInherit } from './use-inherit';
import { useNativeEmitter } from './use-native-emitter';

const COMPONENT_NAME = 'vc-input-number';

export const InputNumber = defineComponent({
	name: COMPONENT_NAME,
	props: inputNumberProps,
	// 无需声明clear，因为会直接绑定到Input，以下是当前组件使用到的
	emits: [
		'update:modelValue',
		'input',
		'change',
		'focus',
		'blur',
		'paste',
		'keydown',
		'keypress',
		'keyup',
		'enter',
		'tip'
	],
	setup(props, { slots, expose }) {
		const input = ref<HTMLElement>();
		
		useNativeEmitter(input, expose);

		const { formatterValue, listeners, plusDisabled, minusDisabled, handleStepper } = useInputNumber();
		const { binds } = useInherit();

		return () => {
			return (
				<Input
					ref={input}
					{
						...binds.value
					}
					modelValue={formatterValue.value}
					clearable={props.clearable}
					prepend={props.prepend}
					append={props.append}
					type={props.type}
					class="vc-input-number"
					{
						...listeners
					}
				>
					{{
						prepend: slots.prepend && (() => slots.prepend?.()),
						append: props.step && (() => slots.append?.() || (
							<div class="vc-input-number__icon">
								<div
									class="vc-input-number__up"
									// @ts-ignore
									disabled={plusDisabled.value && props.disabled}
									onClick={() => handleStepper(1)}
								>
									<Icon type="up" />
								</div>
								<div
									class="vc-input-number__down"
									// @ts-ignore
									disabled={minusDisabled.value && props.disabled}
									onClick={() => handleStepper(-1)}
								>
									<Icon type="down" />
								</div>	
							</div>
						))
					}}
				</Input>
			);
		};
	}
});
