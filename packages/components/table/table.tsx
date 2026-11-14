import { defineComponent } from 'vue';
import { props as tableProps, emits as tableEmits } from './table-props';
import { useTable } from './hooks/use-table';

const COMPONENT_NAME = 'vc-table';

export const Table = defineComponent({
	name: COMPONENT_NAME,
	props: tableProps,
	emits: [...tableEmits],
	setup(props, context) {
		return useTable(props, context);
	}
});
