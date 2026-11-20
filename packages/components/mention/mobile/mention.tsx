import { defineComponent } from 'vue';
import { mobileProps } from '../mention-props';
import { useMention, emits } from '../use-mention';
import { MTextarea } from '../../textarea/index.m';
import { MRecycleList } from '../../recycle-list/index.m';
import { MSpin } from '../../spin/index.m';

const COMPONENT_NAME = 'vcm-mention';

const components = {
	Textarea: MTextarea,
	RecycleList: MRecycleList,
	Spin: MSpin
};

/**
 * 移动端提及：同 Mention，文本域为 MTextarea（属性同 MTextarea），联想为跟随光标的下拉（750 稿尺寸），
 * 按可视区（visualViewport）翻转、限高（见 Popover）；不默认高亮第一项
 */
export const MMention = defineComponent({
	name: COMPONENT_NAME,
	inheritAttrs: false,
	props: mobileProps,
	emits: [...emits],
	setup(props, context) {
		return useMention(props, context, { mobile: true, components });
	}
});
