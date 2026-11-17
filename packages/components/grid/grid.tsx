/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { props as gridProps } from './grid-props';
import { useGrid } from './use-grid';

const COMPONENT_NAME = 'vc-grid';

export const Grid = defineComponent({
	name: COMPONENT_NAME,
	props: gridProps,
	setup(props, context) {
		return useGrid(props, context);
	}
});
