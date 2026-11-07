import { defineComponent } from 'vue';
import { props as badgeProps } from '../badge-props';
import { useBadge } from '../use-badge';

const COMPONENT_NAME = 'vcm-badge';

/**
 * 移动端徽标：尺寸随 --vc-rem 缩放，offset 为 750 稿长度
 */
export const MBadge = defineComponent({
	name: COMPONENT_NAME,
	props: badgeProps,
	setup(props, context) {
		return useBadge(props, context, { mobile: true });
	}
});
