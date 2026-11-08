/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import type { PropType } from 'vue';
import { props as inputNumberProps } from '../input-number-props';

import { MInput } from './input';
import { useInputNumber } from '../use-input-number';

const COMPONENT_NAME = 'vcm-input-number';

export const M_INPUT_NUMBER_THEMES = ['fill', 'border'] as const;
export const M_INPUT_NUMBER_SHAPES = ['square', 'circle'] as const;

export const MInputNumber = defineComponent({
	name: COMPONENT_NAME,
	props: {
		...inputNumberProps,
		// 步进器的填充方案：fill 浅灰底块；border 透明底加 1px 边框。没有步进按钮时不生效（与 MInput 一致）
		theme: {
			type: String as PropType<typeof M_INPUT_NUMBER_THEMES[number]>,
			default: 'fill',
			validator: (v: string) => M_INPUT_NUMBER_THEMES.includes(v as any)
		},
		// 步进按钮的形状：square 方角；circle 圆形按钮、输入区透明
		shape: {
			type: String as PropType<typeof M_INPUT_NUMBER_SHAPES[number]>,
			default: 'square',
			validator: (v: string) => M_INPUT_NUMBER_SHAPES.includes(v as any)
		}
	},
	inheritAttrs: false,
	setup(props, context) {
		const { slots, attrs } = context;
		const { input, displayValue, listeners, plusDisabled, minusDisabled, handleStepper } = useInputNumber(props, context);

		return () => {
			const { theme, shape, ...inputProps } = props;
			return (
				<MInput
					ref={input}
					{
						...inputProps
					}
					controllable={true}
					modelValue={displayValue.value}
					// 有步进按钮时为紧凑的步进器（is-stepper）；没有时与 MInput 的样式一致
					class={[
						{ 'vcm-input-number': !props.styleless, 'is-stepper': !!props.step, 'is-disabled': props.disabled && props.step },
						props.step && [`is-${theme}`, `is-${shape}`]
					]}
					{
						...{
							// 移动端键盘：不允许负数时弹出数字键盘（有小数位时带小数点）；iOS 的数字键盘没有负号，允许负数时保持文本键盘；可由 attrs 覆盖
							inputmode: props.min >= 0 ? (props.precision ? 'decimal' : 'numeric') : undefined,
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
