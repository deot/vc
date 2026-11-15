import { defineComponent } from 'vue';
import { props as stepsProps } from './steps-props';
import { useSteps } from '../use-steps';

const COMPONENT_NAME = 'vcm-steps';

/**
 * 移动端步骤条：同 Steps，根节点另有标记类 vcm-steps，尺寸随 --vc-rem 缩放（750 稿）；labelPosition 默认 bottom
 */
export const MSteps = defineComponent({
	name: COMPONENT_NAME,
	props: stepsProps,
	emits: ['update:modelValue', 'change'],
	setup(props, context) {
		return useSteps(props, context, { mobile: true });
	}
});
