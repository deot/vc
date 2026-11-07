import { defineComponent } from 'vue';
import { props as spinProps } from './spin-props';
import { useSpin } from '../use-spin';

const COMPONENT_NAME = 'vcm-spin';

/**
 * 移动端加载：size 为 750 稿长度，随 --vc-rem 缩放
 */
export const MSpin = defineComponent({
	name: COMPONENT_NAME,
	props: spinProps,
	setup(props, context) {
		return useSpin(props, context, { name: COMPONENT_NAME, rem: true });
	}
});
