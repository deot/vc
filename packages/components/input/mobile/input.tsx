/** @jsxImportSource vue */

import { defineComponent, ref, withDirectives, vShow } from 'vue';
import { props as inputProps } from '../input-props';

import { MIcon } from '../../icon/index.m';
import { MTransitionFade } from '../../transition/index.m';
import { useInput } from '../use-input';
import { useInherit } from '../use-inherit';
import { useNativeEmitter } from '../use-native-emitter';

const COMPONENT_NAME = 'vcm-input';

export const MInput = defineComponent({
	name: COMPONENT_NAME,
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
					class={['vcm-input', classes.value]} 
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
						
						<div class={["vcm-input__content", { 'is-right': props.right }, classes.value]}>
							{
								slots.content?.() || renderInput()
							}
						</div>
						{
							!props.disabled && props.clearable && (
								<MTransitionFade>
									{
										withDirectives(
											(
												<MIcon
													class="vcm-input__icon-clear" 
													type="clear" 
													// @ts-ignore
													onTouchstart={handleClear}
												/>
											),
											[[vShow, !!currentValue.value]]
										)
									}
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
											props.append 
												? <MIcon type={props.append} />
												: null
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
