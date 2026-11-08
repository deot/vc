import { defineComponent } from 'vue';
import { props as sliderProps } from '../slider-props';
import { useSlider } from '../use-slider';
import { MInputNumber } from '../../input/index.m';

const COMPONENT_NAME = 'vcm-slider';

/**
 * 移动端滑块：与 Slider 渲染相同的结构，根节点另有标记类 vcm-slider，尺寸随 --vc-rem 缩放（750 稿）；showInput 使用 MInputNumber
 */
export const MSlider = defineComponent({
	name: COMPONENT_NAME,
	props: sliderProps,
	emits: ['update:modelValue', 'change', 'after-change'],
	setup(props, context) {
		return useSlider(props, context, { mobile: true, InputNumber: MInputNumber });
	}
});
