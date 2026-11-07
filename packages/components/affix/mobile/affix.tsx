import { defineComponent } from 'vue';
import { props as affixProps } from '../affix-props';
import { useAffix } from '../use-affix';

const COMPONENT_NAME = 'vcm-affix';

/**
 * 移动端固钉：数字 offset 为 750 稿长度，随 --vc-rem 缩放
 */
export const MAffix = defineComponent({
	name: COMPONENT_NAME,
	emits: ['update:modelValue'],
	props: affixProps,
	setup(props, context) {
		return useAffix(props, context, { name: COMPONENT_NAME, rem: true });
	}
});
