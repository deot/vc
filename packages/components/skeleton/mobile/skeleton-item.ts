import { defineComponent } from 'vue';
import { props as componentProps } from '../skeleton-item-props';
import { useSkeletonItem } from '../use-skeleton-item';

const COMPONENT_NAME = 'vcm-skeleton-item';

/**
 * 移动端骨架块：同 SkeletonItem，另有标记类 vcm-skeleton-item；数字宽高为 750 稿长度
 */
export const MSkeletonItem = defineComponent({
	name: COMPONENT_NAME,
	props: componentProps,
	setup(props, context) {
		return useSkeletonItem(props, context, { mobile: true });
	}
});
