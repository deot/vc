import { defineComponent } from 'vue';
import { props as dividerProps } from '../divider-props';
import { useDivider } from '../use-divider';

const COMPONENT_NAME = 'vcm-divider';

/**
 * 移动端分割线：同 Divider，根节点另有标记类 vcm-divider，尺寸随 --vc-rem 缩放（750 稿）；属性、插槽与 Divider 相同
 */
export const MDivider = defineComponent({
	name: COMPONENT_NAME,
	props: dividerProps,
	setup(props, context) {
		return useDivider(props, context, { mobile: true });
	}
});
