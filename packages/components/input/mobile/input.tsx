/** @jsxImportSource vue */

import { defineComponent, withModifiers } from 'vue';
import { useAttrs } from '@deot/vc-hooks';
import { props as inputProps } from '../input-props';

import { MIcon } from '../../icon/index.m';
import { MTransitionFade } from '../../transition/index.m';
import { useInput } from '../use-input';

const COMPONENT_NAME = 'vcm-input';

export const MInput = defineComponent({
	name: COMPONENT_NAME,
	inheritAttrs: false,
	props: {
		...inputProps,
		right: {
			type: Boolean,
			default: false
		}
	},
	emits: [
		'update:modelValue',
		'input',
		'change',
		'focus',
		'blur',
		'clear',
		'paste',
		'keydown',
		'keypress',
		'keyup',
		'enter',
		'tip'
	],
	setup(props, context) {
		const { slots } = context;
		const it = useAttrs({ merge: false });

		const {
			input,
			currentValue,
			currentMaxlength,
			hasValue,
			classes,
			listeners,
			handleClear
		} = useInput(props, context);

		const renderInput = (merge: boolean) => {
			const binds = merge
				? {
						class: it.value.class,
						style: [props.inputStyle, it.value.style],
						...it.value.attrs,
						...it.value.listeners,
						...listeners
					}
				: {
						style: props.inputStyle,
						...it.value.attrs,
						...it.value.listeners,
						...listeners
					};
			return (
				// @ts-ignore
				<input
					type="text"
					ref={input}
					{...binds}
					id={props.inputId}
					disabled={props.disabled}
					value={currentValue.value}
					maxlength={currentMaxlength.value}
				/>
			);
		};

		return () => {
			if (props.styleless) return renderInput(true);
			return (
				<div
					class={['vcm-input', classes.value, it.value.class]}
					style={it.value.style}
					id={props.id}
				>
					<div class="vcm-input__wrapper">
						{
							(slots.prepend || props.prepend) && (
								<div
									class={['vcm-input__prepend', { 'is-icon': props.prepend, 'is-afloat': props.afloat }, classes.value]}
								>
									{
										slots.prepend?.() || (
											props.prepend && <MIcon type={props.prepend} />
										)
									}
								</div>
							)
						}

						<div class={['vcm-input__content', { 'is-right': props.right }, classes.value]}>
							{
								slots.content?.() || renderInput(false)
							}
						</div>
						{
							!props.disabled && props.clearable && (
								<MTransitionFade>
									<MIcon
										v-show={hasValue.value}
										class="vcm-input__icon-clear"
										type="clear"
										// 阻止默认行为：输入框不失焦、键盘不收起，触屏上也不再派发 mousedown；mousedown 供桌面浏览器使用
										// @ts-ignore
										onTouchstart={withModifiers(handleClear, ['prevent'])}
										onMousedown={withModifiers(handleClear, ['prevent'])}
									/>
								</MTransitionFade>
							)
						}

						{
							(slots.append || props.append) && (
								<div
									class={['vcm-input__append', { 'is-icon': props.append }, classes.value]}
								>
									{
										slots.append?.() || (
											props.append && <MIcon type={props.append} />
										)
									}
								</div>
							)
						}
					</div>
				</div>
			);
		};
	}
});
