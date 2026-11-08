import { defineComponent } from 'vue';
import { props as radioProps } from '../radio-props';
import { useRadio } from '../use-radio';

const COMPONENT_NAME = 'vcm-radio';

export const MRadio = defineComponent({
	name: COMPONENT_NAME,
	props: radioProps,
	emits: ['update:modelValue', 'change'],
	setup(props, context) {
		// 移动端只有圆点外观，不随分组的type变化
		return useRadio(props, context, { name: COMPONENT_NAME, variant: 'default' });
	}
});
