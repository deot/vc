import { defineComponent } from 'vue';
import { props as floatButtonProps } from '../float-button-props';
import { useFloatButton } from '../use-float-button';

const COMPONENT_NAME = 'vcm-float-button';

/**
 * 移动端悬浮按钮：同 FloatButton，按钮另有标记类 vcm-float-button；数字 gap 为 750 稿长度，随 --vc-rem 缩放
 */
export const MFloatButton = defineComponent({
	name: COMPONENT_NAME,
	inheritAttrs: false,
	props: floatButtonProps,
	emits: ['update:offset', 'after-change', 'click'],
	setup(props, context) {
		return useFloatButton(props, context, { mobile: true });
	}
});
