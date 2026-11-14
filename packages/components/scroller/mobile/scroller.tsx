import { defineComponent } from 'vue';
import { props as scrollerProps } from '../scroller-props';
import { useScroller } from '../use-scroller';

const COMPONENT_NAME = 'vcm-scroller';

/**
 * 移动端滚动容器：同 Scroller，根节点另有标记类 vcm-scroller
 * 1. 数字 height / maxHeight 为 750 稿长度，随 --vc-rem 缩放
 * 2. 未设置 always 时始终使用原生滚动条（触摸设备没有悬停）；always 的自绘滚动条只作指示，不响应点按，见 ./style.scss
 */
export const MScroller = defineComponent({
	name: COMPONENT_NAME,
	props: scrollerProps,
	emits: ['scroll'],
	setup(props, context) {
		return useScroller(props, context, { mobile: true });
	}
});
