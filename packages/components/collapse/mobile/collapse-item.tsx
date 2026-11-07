import { defineComponent } from 'vue';
import { props as collapseItemProps } from '../collapse-item-props';
import { useCollapseItem } from '../use-collapse-item';

const COMPONENT_NAME = 'vcm-collapse-item';

/**
 * 移动端折叠面板项：尺寸随 --vc-rem 缩放（750 稿），内置箭头在右侧时与 MListItem 一致，在左侧时同桌面端；属性、插槽、方法与 CollapseItem 相同
 */
export const MCollapseItem = defineComponent({
	name: COMPONENT_NAME,
	props: collapseItemProps,
	setup(props, context) {
		return useCollapseItem(props, context, { mobile: true });
	}
});
