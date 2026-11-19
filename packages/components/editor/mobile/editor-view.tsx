import { defineComponent } from 'vue';
import { props as editorViewProps } from '../editor-view-props';
import { useEditorView } from '../use-editor-view';
import { MImagePreview } from '../../file-preview/index.m';

const COMPONENT_NAME = 'vcm-editor-view';

/**
 * 移动端富文本展示：同 EditorView，根节点另有标记类 vcm-editor-view，字号随 --vc-rem 缩放；点击图片打开移动端查看器
 */
export const MEditorView = defineComponent({
	name: COMPONENT_NAME,
	props: editorViewProps,
	setup(props) {
		return useEditorView(props, { mobile: true, components: { ImagePreview: MImagePreview } });
	}
});
