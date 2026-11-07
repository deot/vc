import { defineComponent } from 'vue';
import { props as tagProps } from '../tag-props';
import { useTag } from '../use-tag';

const COMPONENT_NAME = 'vcm-tag';

/**
 * 移动端标签：尺寸随 --vc-rem 缩放（750 稿），三种 type 等高；属性、事件、插槽与 Tag 相同
 */
export const MTag = defineComponent({
	name: COMPONENT_NAME,
	props: tagProps,
	emits: ['close', 'change'],
	setup(props, context) {
		return useTag(props, context, { mobile: true });
	}
});
