import { defineComponent } from 'vue';
import { props as backTopProps } from '../back-top-props';
import { useBackTop } from '../use-back-top';

const COMPONENT_NAME = 'vcm-back-top';

/**
 * 移动端回到顶部：同 BackTop，按钮另有标记类 vcm-back-top；数字 visibilityHeight / right / bottom 为 750 稿长度，随 --vc-rem 缩放
 */
export const MBackTop = defineComponent({
	name: COMPONENT_NAME,
	inheritAttrs: false,
	props: backTopProps,
	emits: ['update:modelValue', 'click'],
	setup(props, context) {
		return useBackTop(props, context, { mobile: true });
	}
});
