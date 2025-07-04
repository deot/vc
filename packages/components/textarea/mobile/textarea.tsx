/** @jsxImportSource vue */

import { defineComponent, ref } from 'vue';
import useTextarea from '../use-textarea';
import { props as textareaProps } from '../textarea-props';

const COMPONENT_NAME = 'vcm-textarea';

export const MTextarea = defineComponent({
	name: COMPONENT_NAME,
	props: Object.assign({}, textareaProps, {
		align: {
			type: String,
			default: 'left'
		}
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
		return () => {
			return (
				<div class={[classes.value, 'vcm-textarea']}>
					<div class="vcm-textarea__wrapper">
						<div style={contentStyle.value} class={['vcm-textarea__content']}>
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
				</div>
			);
		};
	}
});
