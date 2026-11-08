import { defineComponent } from 'vue';
import { props as cardProps } from './card-props';
import { useCard } from '../use-card';

const COMPONENT_NAME = 'vcm-card';

/**
 * 移动端卡片：尺寸随 --vc-rem 缩放（750 稿），padding 为 750 稿长度；无悬停浮起阴影；属性、插槽与 Card 相同
 */
export const MCard = defineComponent({
	name: COMPONENT_NAME,
	props: cardProps,
	setup(props, context) {
		return useCard(props, context, { mobile: true });
	}
});
