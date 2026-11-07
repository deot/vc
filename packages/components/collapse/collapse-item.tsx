import { defineComponent } from 'vue';
import { props as collapseItemProps } from './collapse-item-props';
import { useCollapseItem } from './use-collapse-item';

const COMPONENT_NAME = 'vc-collapse-item';

export const CollapseItem = defineComponent({
	name: COMPONENT_NAME,
	props: collapseItemProps,
	setup(props, context) {
		return useCollapseItem(props, context);
	}
});
