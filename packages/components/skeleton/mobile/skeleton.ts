import { defineComponent } from 'vue';
import { props as componentProps } from '../skeleton-props';
import { useSkeleton } from '../use-skeleton';

const COMPONENT_NAME = 'vcm-skeleton';

/**
 * 移动端骨架屏：同 Skeleton，根节点另有标记类 vcm-skeleton；尺寸随 --vc-rem 缩放（750 稿），数字长度为 750 稿
 */
export const MSkeleton = defineComponent({
	name: COMPONENT_NAME,
	props: componentProps,
	setup(props, context) {
		return useSkeleton(props, context, { mobile: true });
	}
});
