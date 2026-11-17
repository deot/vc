import { defineComponent } from 'vue';
import { props as pickerViewProps } from './color-picker-view-props';
import { useColorPickerView } from './use-color-picker-view';

const COMPONENT_NAME = 'vc-color-picker-view';

export const ColorPickerView = defineComponent({
	name: COMPONENT_NAME,
	props: pickerViewProps,
	emits: ['change', 'update:modelValue'],
	setup(props, context) {
		return useColorPickerView(props, context);
	}
});
