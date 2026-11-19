import { defineComponent } from 'vue';
import { props as editorViewProps } from './editor-view-props';
import { useEditorView } from './use-editor-view';

const COMPONENT_NAME = 'vc-editor-view';

export const EditorView = defineComponent({
	name: COMPONENT_NAME,
	props: editorViewProps,
	setup(props) {
		return useEditorView(props);
	}
});
