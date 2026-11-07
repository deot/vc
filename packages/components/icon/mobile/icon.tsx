import { defineComponent } from 'vue';
import { props as iconProps } from '../icon-props';
import { useIcon } from '../use-icon';

const COMPONENT_NAME = 'vcm-icon';

/**
 * 移动端图标：同 Icon，根节点另有标记类 vcm-icon；数字 size 为 750 稿长度，随 --vc-rem 缩放；不传 size 时跟随外层字号
 */
export const MIcon = defineComponent({
	name: COMPONENT_NAME,
	props: iconProps,
	setup(props, context) {
		return useIcon(props, context, { mobile: true });
	}
});
