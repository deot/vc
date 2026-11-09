/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { useTextarea } from './use-textarea';
import { props as textareaProps } from './textarea-props';

const COMPONENT_NAME = 'vc-textarea';

export const Textarea = defineComponent({
	name: COMPONENT_NAME,
	props: textareaProps,
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
			// 计数在框外（默认）时根节点留出它的高度，在框内（inline）时文本区底部留出它的高度
			const inline = typeof props.indicator === 'object' && !!props.indicator.inline;
			return (
				<div
					class={[
						classes.value,
						'vc-textarea',
						{
							'has-indicator': !!indicator.value,
							'is-indicator-inline': !!indicator.value && inline
						}
					]}
				>
					<div class="vc-textarea__wrapper">
						<div style={contentStyle.value} class="vc-textarea__content">
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
							indicator.value && (
								<div
									class={[
										props.indicateClass,
										{
											'is-inline': inline,
											'is-exceeded': indicator.value.exceeded
										},
										'vc-textarea__indicator'
									]}
								>
									{indicator.value.text}
								</div>
							)
						}
					</div>
				</div>
			);
		};
	}
});
