import { defineComponent } from 'vue';
import { props as marqueeProps } from '../marquee-props';
import { useMarquee } from '../use-marquee';

const COMPONENT_NAME = 'vcm-marquee';

/**
 * 移动端跑马灯：同 Marquee，根节点另有标记类 vcm-marquee，间距随 --vc-rem 缩放（750 稿）；属性、插槽、事件与 Marquee 相同
 */
export const MMarquee = defineComponent({
	name: COMPONENT_NAME,
	props: marqueeProps,
	emits: ['loop'],
	setup(props, context) {
		return useMarquee(props, context, { mobile: true });
	}
});
