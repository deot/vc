/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { props as editorProps } from './editor-props';

const COMPONENT_NAME = 'vc-editor';

export const Editor = defineComponent({
	name: COMPONENT_NAME,
	props: editorProps,
	setup(props, { slots }) {
		return () => {
			return (
				<div class="vc-editor">
					{ slots?.default?.() }
				</div>
			);
		};
	}
});
