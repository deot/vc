/** @jsxImportSource vue */

import { defineComponent, ref } from 'vue';
import { useAttrs } from '@deot/vc-hooks';
import { props as inputProps } from '../input-props';

import { MIcon } from '../../icon/index.m';
import { MTransitionFade } from '../../transition/index.m';
import { useInput } from '../use-input';
import { useNativeEmitter } from '../use-native-emitter';

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
	setup(props, { slots, expose }) {
		const input = ref<HTMLInputElement>();
		const it = useAttrs({ merge: false });

		useNativeEmitter(input, expose);

		const {
			currentValue,
			currentMaxlength,
			classes,
			listeners,
			handleClear
		} = useInput(input);

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
										v-show={!!currentValue.value}
										class="vcm-input__icon-clear"
										type="clear"
										// @ts-ignore
										onTouchstart={handleClear}
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
