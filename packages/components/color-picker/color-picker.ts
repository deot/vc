import { defineComponent } from 'vue';
import { props as colorPickerProps } from './color-picker-props';
import { useColorPicker } from './hooks/use-color-picker';

const COMPONENT_NAME = 'vc-color-picker';

export const ColorPicker = defineComponent({
	name: COMPONENT_NAME,
	props: colorPickerProps,
	inheritAttrs: false,
	emits: [
		'update:modelValue',
		'change',
		'clear',
		'color-change',
		'visible-change',
		'ready',
		'close'
	],
	setup(props, context) {
		return useColorPicker(props, context);
	}
});
