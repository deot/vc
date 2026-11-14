import { defineComponent } from 'vue';
import { props as recycleListProps } from '../recycle-list-props';
import { useRecycleList } from '../hooks/use-recycle-list';
import { MScroller } from '../../scroller/index.m';

const COMPONENT_NAME = 'vcm-recycle-list';

/**
 * 移动端虚拟列表：同 RecycleList，根节点另有标记类 vcm-recycle-list，尺寸随 --vc-rem 缩放（750 稿）
 * 1. 数字 gap / estimateSize 为 750 稿长度；overscan / threshold 仍为 px
 * 2. 内部滚动容器为 MScroller：未设置 always 时使用原生滚动条，scrollerOptions 的数字 height / maxHeight 为 750 稿长度
 * 3. render* 与对应插槽的参数 mobile 为 true
 */
export const MRecycleList = defineComponent({
	name: COMPONENT_NAME,
	props: recycleListProps,
	emits: ['scroll', 'row-resize', 'load-change'],
	setup(props, context) {
		return useRecycleList(props, context, { mobile: true, Scroller: MScroller });
	}
});
