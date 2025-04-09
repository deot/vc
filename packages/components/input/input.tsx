/** @jsxImportSource vue */

import { defineComponent, computed, ref, withModifiers } from 'vue';
import type { PropType } from 'vue';
import { useAttrs } from '@deot/vc-hooks';

import { props as inputProps } from './input-props';

import { Icon } from '../icon/index';
import { TransitionFade } from '../transition/index';
import { useInput } from './use-input';
import { useNativeEmitter } from './use-native-emitter';
import { getBytesSize } from './utils';

const COMPONENT_NAME = 'vc-input';

export const Input = defineComponent({
	name: COMPONENT_NAME,
	inheritAttrs: false,
	props: {
		...inputProps,
		indicator: {
			type: [Boolean, Object] as PropType<boolean | ({ inline: boolean; inverted: boolean })>,
			default: false
		},
		indicateClass: String
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

		useNativeEmitter(input, expose);
		const it = useAttrs({ merge: false });

		const {
			currentValue,
			currentMaxlength,
			classes,
			listeners,
			handleClear
		} = useInput(input);

		const showIndicatorInline = computed(() => {
			return typeof props.indicator === 'object' && props.indicator.inline;
		});

		const indicatorNum = computed(() => {
			if (typeof props.maxlength === 'undefined' || Array.isArray(currentValue.value)) return;
			const { maxlength } = props;
			const value = String(currentValue.value);
			const length = props.bytes ? getBytesSize(value) : value.length;

			const current = typeof props.indicator === 'object' && props.indicator.inverted
				? maxlength - length
				: length;

			return `${current}/${maxlength}`;
		});

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
					class={['vc-input', classes.value, it.value.class]}
					style={it.value.style}
					id={props.id}
				>
					<div class="vc-input__wrapper">
						{
							(slots.prepend || props.prepend) && (
								<div
									class={['vc-input__prepend', { 'is-icon': props.prepend, 'is-afloat': props.afloat }, classes.value]}
								>
									{
										slots.prepend?.() || (
											props.prepend && <Icon type={props.prepend} />
										)
									}
								</div>
							)
						}

						<div class={['vc-input__content', classes.value]}>
							{
								slots.content?.() || renderInput(false)
							}
						</div>
						{
							(!props.disabled && props.clearable) && (
								<TransitionFade>
									<Icon
										class="vc-input__icon-clear"
										type="clear"
										// @ts-ignore prevent 用于触发focus时，光标聚焦
										onMousedown={withModifiers(handleClear, ['prevent'])}
									/>
								</TransitionFade>
							)
						}

						{
							(slots.append || props.append || props.indicator) && (
								<div
									class={['vc-input__append', { 'is-icon': props.append, 'is-afloat': props.afloat }, classes.value]}
								>
									{
										slots.append?.() || (
											props.append
												? <Icon type={props.append} />
												: showIndicatorInline.value
													? (
															<span
																class={['vc-input__indicator is-in', props.indicateClass]}
															>
																{ indicatorNum.value }
															</span>
														)
													: null
										)
									}
								</div>
							)
						}
					</div>
					{
						props.indicator && !showIndicatorInline.value && (
							<span
								class={['vc-input__indicator is-out', props.indicateClass]}
							>
								{ indicatorNum.value }
							</span>
						)
					}
				</div>
			);
		};
	}
});
