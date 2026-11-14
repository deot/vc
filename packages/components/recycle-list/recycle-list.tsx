import { defineComponent } from 'vue';
import { props as recycleListProps } from './recycle-list-props';
import { useRecycleList } from './hooks/use-recycle-list';

const COMPONENT_NAME = 'vc-recycle-list';

export const RecycleList = defineComponent({
	name: COMPONENT_NAME,
	props: recycleListProps,
	emits: ['scroll', 'row-resize', 'load-change'],
	setup(props, context) {
		return useRecycleList(props, context);
	}
});

export type { ScrollToIndexOptions } from './hooks/use-recycle-list';
