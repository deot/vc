import { defineComponent } from 'vue';
import { props as rateProps } from '../rate-props';
import { useRate } from '../use-rate';

const COMPONENT_NAME = 'vcm-rate';

/**
 * 移动端评分：同 Rate，根节点另有标记类 vcm-rate，尺寸随 --vc-rem 缩放（750 稿）
 */
export const MRate = defineComponent({
	name: COMPONENT_NAME,
	props: rateProps,
	emits: ['update:modelValue', 'change'],
	setup(props, context) {
		return useRate(props, context, { mobile: true });
	}
});
