import { defineComponent } from 'vue';
import { props as viewProps } from './color-picker-view-props';
import { useColorPickerView } from '../color-picker-view/use-color-picker-view';
import { MSlider } from '../../slider/index.m';
import { MInput } from '../../input/index.m';

const COMPONENT_NAME = 'vcm-color-picker-view';

/**
 * 移动端选色视图：与 ColorPickerView 渲染相同的色板、色相 / 透明度条与预设色，根节点另有标记类 vcm-color-picker-view，尺寸随 --vc-rem 缩放（750 稿）
 * 	- 顶部多一行取值：色块、色值（editable 时可输入）、清空（clearable 且有值时）
 * 	- 色相、透明度条为 MSlider，滑块为圆形
 */
export const MColorPickerView = defineComponent({
	name: COMPONENT_NAME,
	props: viewProps,
	emits: ['change', 'update:modelValue', 'clear'],
	setup(props, context) {
		return useColorPickerView(props, context, { mobile: true, Slider: MSlider, Input: MInput });
	}
});
