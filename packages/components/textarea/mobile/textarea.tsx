/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { useTextarea, emits } from '../use-textarea';
import { toPlaintext } from '../utils';
import { props as textareaProps } from '../textarea-props';
import { rightProps } from '../../input/input-props';

const COMPONENT_NAME = 'vcm-textarea';

export const MTextarea = defineComponent({
	name: COMPONENT_NAME,
	props: {
		...textareaProps,
		// 文字右对齐，与 MInput 的 right 一致
		...rightProps
	},
	emits: [...emits],
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
			if (props.plaintext) {
				return (<span class="vcm-textarea-plaintext">{ toPlaintext(currentValue.value, props.extra) }</span>);
			}
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
