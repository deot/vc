import { defineComponent } from 'vue';
import { props as indexBarProps } from '../index-bar-props';
import { useIndexBar } from '../use-index-bar';
import { MAffix } from '../../affix/index.m';
import { MRecycleList } from '../../recycle-list/index.m';
import { MScroller } from '../../scroller/index.m';

const COMPONENT_NAME = 'vcm-index-bar';

/**
 * 移动端索引栏：同 IndexBar，根节点另有标记类 vcm-index-bar，尺寸随 --vc-rem 缩放（750 稿）；
 * 数字 height / maxHeight / offset / estimateSize 为 750 稿长度
 */
export const MIndexBar = defineComponent({
	name: COMPONENT_NAME,
	props: indexBarProps,
	emits: ['update:modelValue', 'change'],
	setup(props, context) {
		return useIndexBar(props, context, {
			mobile: true,
			components: { Affix: MAffix, RecycleList: MRecycleList, Scroller: MScroller }
		});
	}
});
