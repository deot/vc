/** @jsxImportSource vue */

import { defineComponent, computed, ref, withDirectives, vShow } from 'vue';
import type { PropType } from 'vue';
import { props as inputProps } from './input-props';

import { Icon } from '../icon/index';
import { TransitionFade } from '../transition/index';
import { useInput } from './use-input';
import { useInherit } from './use-inherit';
import { useNativeEmitter } from './use-native-emitter';
import { getBytesLength } from './utils';

const COMPONENT_NAME = 'vc-input';

export const Input = defineComponent({
	name: COMPONENT_NAME,
	props: {
		...inputProps,
		indicator: {
			type: [Boolean, Object] as PropType<boolean | ({ inline: boolean; inverted: boolean })>,
			default: false
		},
		indicateClassName: String
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
		const input = ref<HTMLElement>();
		
		useNativeEmitter(input, expose);

		const { binds } = useInherit();
		const { 
			currentValue,
			currentMaxlength,
			classes,
			listeners,
			handleClear
		} = useInput(input);

		const indicatorNum = computed(() => {
			if (typeof props.maxlength === 'undefined') return;
			let currentLength = (String(props.modelValue) || '').length;
			let extraLength = props.bytes ? getBytesLength(props.modelValue) || 0 : 0;
			let length = typeof props.maxlength === 'number' && typeof props.indicator === 'object' && props.indicator.inverted 
				? props.maxlength + extraLength - currentLength 
				: currentLength - extraLength;
			return `${length}/${props.maxlength}`;
		});

		const showIndicatorInline = computed(() => {
			return typeof props.indicator === 'object' && props.indicator.inline;
		});

		const renderInput = () => {
			return (
				// @ts-ignore
				<input
					ref={input}
					{ ...binds.value }
					value={currentValue.value}
					maxlength={currentMaxlength.value}
					style={props.inputStyle}
					{ 
						...listeners 
					}
				/>
			);
		};

		return () => {
			if (props.styleless) return renderInput();
			return (
				<div 
					class={['vc-input', classes.value]} 
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
						
						<div class={["vc-input__content", classes.value]}>
							{
								slots.content?.() || renderInput()
							}
						</div>
						{
							!props.disabled && props.clearable && (
								<TransitionFade>
									{
										withDirectives(
											(
												<Icon
													class="vc-input__icon-clear" 
													type="clear" 
													// @ts-ignore
													onClick={handleClear}
												/>
											),
											[[vShow, !!currentValue.value]]
										)
									}
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
															class={['vc-input__indicator is-in', props.indicateClassName]}
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
								class={["vc-input__indicator is-out", props.indicateClassName]}
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
