import { defineComponent } from 'vue';
import { props as alertProps } from '../alert-props';
import { useAlert } from '../use-alert';
import { MMarquee } from '../../marquee/index.m';

const COMPONENT_NAME = 'vcm-alert';

/**
 * 移动端提示：同 Alert，根节点另有标记类 vcm-alert；通栏样式（无边框、无圆角），文字用状态色，尺寸随 --vc-rem 缩放（750 稿）
 * 属性、插槽、事件与 Alert 相同；跑马灯使用 MMarquee
 */
export const MAlert = defineComponent({
	name: COMPONENT_NAME,
	props: alertProps,
	emits: ['close', 'update:modelValue', 'visible-change'],
	setup(props, context) {
		return useAlert(props, context, { mobile: true, Marquee: MMarquee });
	}
});
