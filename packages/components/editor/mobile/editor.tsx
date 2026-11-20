import { defineComponent } from 'vue';
import { defaults } from '../default-options';
import { props as editorProps } from './editor-props';
import { useEditor, emits } from '../use-editor';
import { MActionSheet } from '../../action-sheet/index.m';
import { MPopup } from '../../popup/index.m';
import { MInput } from '../../input/index.m';
import { MButton } from '../../button/index.m';
import { MImagePreview } from '../../file-preview/index.m';
import { MRecycleList } from '../../recycle-list/index.m';
import { MSpin } from '../../spin/index.m';
import type { EditorComponents } from '../types';

const COMPONENT_NAME = 'vcm-editor';

export const components: EditorComponents = {
	ActionSheet: MActionSheet,
	Popup: MPopup,
	Input: MInput,
	Button: MButton,
	ImagePreview: MImagePreview,
	RecycleList: MRecycleList,
	Spin: MSpin
};

/**
 * 移动端富文本：同 Editor，根节点另有标记类 vcm-editor，尺寸随 --vc-rem 缩放（750 稿）
 * 1. 工具栏单行横向滚动；选择项用动作面板，颜色、链接输入用底部弹出层
 * 2. toolbarPlacement 默认 keyboard：聚焦时工具栏停在虚拟键盘上方
 * 3. 点击图片打开移动端查看器；enhancer 入参 mobile 为 true
 * 4. 提及（mentionOptions）的列表停靠在虚拟键盘上方
 */
export const MEditor = defineComponent({
	name: COMPONENT_NAME,
	props: editorProps,
	defaults,
	emits: [...emits],
	setup(props, context) {
		return useEditor(props, context, { mobile: true, components });
	}
});
