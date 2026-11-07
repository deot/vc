import { defineComponent } from 'vue';
import { props as buttonGroupProps } from '../button-group-props';
import { useButtonGroup } from '../use-button-group';

const COMPONENT_NAME = 'vcm-button-group';

/**
 * 移动端按钮组：同 ButtonGroup，根节点另有标记类 vcm-button-group，首尾圆角与组内 MButton 的尺寸一致
 */
export const MButtonGroup = defineComponent({
	name: COMPONENT_NAME,
	props: buttonGroupProps,
	setup(props, context) {
		return useButtonGroup(props, context, { mobile: true });
	}
});
