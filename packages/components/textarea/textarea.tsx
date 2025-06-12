/** @jsxImportSource vue */

import { defineComponent, ref, computed } from 'vue';
import useTextarea from './use-textarea';
import { props as textareaProps } from './textarea-props';
import { getBytesSize } from '../input/utils';

const COMPONENT_NAME = 'vc-textarea';

export const Textarea = defineComponent({
	name: COMPONENT_NAME,
	props: Object.assign(textareaProps, {
		indicator: {
			type: [Boolean, Object],
			default: false
		},
		indicateClass: String
	}),
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
		'cancel',
		'resize'
	],
	setup(props, { expose }) {
		const textarea = ref<HTMLTextAreaElement>();
		const {
			currentValue,
			classes,
			contentStyle,
			listeners,
			binds,
			calcTextareaStyle,
			currentMaxlength
		} = useTextarea(textarea, expose);
		const indicatorNum = computed(() => {
			const currentLength = (String(props.modelValue) || '').length;
			const extraLength = props.bytes ? getBytesSize(props.modelValue as any) || 0 : 0;
			const length = props.indicator && (props.indicator as any).inverted
				? props.maxlength! + extraLength - currentLength
				: currentLength - extraLength;
			return `${length}/${props.maxlength}`;
		});

		const indicateInline = computed(() => {
			return props.indicator && (props.indicator as any).inline;
		});

		return () => {
			return (
				<div class={[classes.value, 'vc-textarea']}>
					<div class="vc-textarea__wrapper">
						<div style={contentStyle.value} class={['vc-textarea__content']}>
							{ /* @ts-ignore */ }
							<textarea
								ref={textarea}
								{...binds.value}
								{...listeners.value}
								value={currentValue.value}
								maxlength={currentMaxlength.value}
								style={[props.textareaStyle, calcTextareaStyle.value]}
							/>
						</div>
						{
							props.indicator && (
								<div
									class={[
										props.indicateClass,
										{
											'is-inline': indicateInline.value
										},
										'vc-textarea__indicator'
									]}
								>
									{indicatorNum.value}
								</div>
							)
						}
					</div>
				</div>
			);
		};
	}
});
