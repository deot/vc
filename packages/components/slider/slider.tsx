import { defineComponent } from 'vue';
import { props as sliderProps } from './slider-props';
import { useSlider } from './use-slider';

const COMPONENT_NAME = 'vc-slider';

export const Slider = defineComponent({
	name: COMPONENT_NAME,
	props: sliderProps,
	emits: ['update:modelValue', 'change', 'after-change'],
	setup(props, context) {
		return useSlider(props, context);
	}
});
