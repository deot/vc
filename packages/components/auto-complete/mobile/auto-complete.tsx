import { defineComponent } from 'vue';
import { mobileProps } from '../auto-complete-props';
import { useAutoComplete, emits } from '../use-auto-complete';
import { MInput } from '../../input/index.m';
import { MRecycleList } from '../../recycle-list/index.m';
import { MSpin } from '../../spin/index.m';

const COMPONENT_NAME = 'vcm-auto-complete';

const components = {
	Input: MInput,
	RecycleList: MRecycleList,
	Spin: MSpin
};

/**
 * 移动端输入联想：同 AutoComplete，输入框为 MInput（属性同 MInput），联想项为 750 稿尺寸
 * 弹层按可视区（visualViewport）翻转、限高（见 Popover），软键盘弹出后下方放不下时翻到输入框上方；不默认高亮第一项
 */
export const MAutoComplete = defineComponent({
	name: COMPONENT_NAME,
	inheritAttrs: false,
	props: mobileProps,
	emits: [...emits],
	setup(props, context) {
		return useAutoComplete(props, context, { mobile: true, components });
	}
});
