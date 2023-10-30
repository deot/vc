/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { props as textareaProps } from './textarea-props';

const COMPONENT_NAME = 'vc-textarea';

export const Textarea = defineComponent({
	name: COMPONENT_NAME,
	props: textareaProps,
	setup(props, { slots }) {
		return () => {
			return (
				<div class="vc-textarea">
					{ slots?.default?.() }
				</div>
			);
		};
	}
});
