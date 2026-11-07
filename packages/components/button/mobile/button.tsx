import { defineComponent } from 'vue';
import { props as buttonProps } from '../button-props';
import { useButton } from '../use-button';

const COMPONENT_NAME = 'vcm-button';

/**
 * 移动端按钮：同 Button，根节点另有标记类 vcm-button，尺寸随 --vc-rem 缩放（750 稿）；属性、事件、插槽与 Button 相同
 */
export const MButton = defineComponent({
	name: COMPONENT_NAME,
	emits: ['click'],
	props: buttonProps,
	setup(props, context) {
		return useButton(props, context, { mobile: true });
	}
});
