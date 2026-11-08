import { defineComponent } from 'vue';
import { props as radioProps } from '../radio-props';
import { useRadio } from '../use-radio';

const COMPONENT_NAME = 'vcm-radio-button';

// 单项的按钮样式：外观固定为button，与所在分组的type无关，可与圆点项混用
export const MRadioButton = defineComponent({
	name: COMPONENT_NAME,
	props: radioProps,
	emits: ['update:modelValue', 'change'],
	setup(props, context) {
		return useRadio(props, context, { name: 'vcm-radio', variant: 'button' });
	}
});
