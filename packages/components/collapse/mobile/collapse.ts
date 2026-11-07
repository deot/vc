import { defineComponent } from 'vue';
import { props as collapseProps } from '../collapse-props';
import { useCollapse } from '../use-collapse';

const COMPONENT_NAME = 'vcm-collapse';

/**
 * 移动端折叠面板：尺寸随 --vc-rem 缩放（750 稿）；属性、事件、插槽与 Collapse 相同
 */
export const MCollapse = defineComponent({
	name: COMPONENT_NAME,
	props: collapseProps,
	emits: ['update:modelValue', 'change'],
	setup(props, context) {
		return useCollapse(props, context, { mobile: true });
	}
});
