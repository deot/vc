import { defineComponent } from 'vue';
import { props as intersectionProps } from '../intersection-props';
import { useIntersection } from '../use-intersection';

const COMPONENT_NAME = 'vcm-intersection';

/**
 * 移动端可视区监听：同 Intersection，根节点另有标记类 vcm-intersection；数字 offset 为 750 稿长度，随 --vc-rem 缩放
 */
export const MIntersection = defineComponent({
	name: COMPONENT_NAME,
	props: intersectionProps,
	emits: ['update:modelValue', 'change'],
	setup(props, context) {
		return useIntersection(props, context, { mobile: true });
	}
});
