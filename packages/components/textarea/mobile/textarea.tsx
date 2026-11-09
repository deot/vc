/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { useTextarea } from '../use-textarea';
import { props as textareaProps } from '../textarea-props';

const COMPONENT_NAME = 'vcm-textarea';

export const MTextarea = defineComponent({
	name: COMPONENT_NAME,
	props: Object.assign({}, textareaProps, {
		// 文字右对齐，与 MInput 的 right 一致
		right: {
			type: Boolean,
			default: false
		}
	}),
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
		'resize'
	],
	setup(props, context) {
		const {
			textarea,
			currentValue,
			classes,
			contentStyle,
			listeners,
			binds,
			calcTextareaStyle,
			currentMaxlength,
			indicator
		} = useTextarea(props, context);
		return () => {
			return (
				<div class={[classes.value, 'vcm-textarea', { 'is-right': props.right }]}>
					<div class="vcm-textarea__wrapper">
						<div style={contentStyle.value} class="vcm-textarea__content">
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
					</div>
					{
						// 计数始终在框内右下角，排在文本区下方
						indicator.value && (
							<div class={[props.indicateClass, { 'is-exceeded': indicator.value.exceeded }, 'vcm-textarea__indicator']}>
								{indicator.value.text}
							</div>
						)
					}
				</div>
			);
		};
	}
});
