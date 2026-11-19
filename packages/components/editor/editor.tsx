import { defineComponent } from 'vue';
import { defaults } from './default-options';
import { props as editorProps } from './editor-props';
import { useEditor, emits } from './use-editor';

const COMPONENT_NAME = 'vc-editor';

export const Editor = defineComponent({
	name: COMPONENT_NAME,
	props: editorProps,
	defaults,
	emits: [...emits],
	setup(props, context) {
		return useEditor(props, context);
	}
});
