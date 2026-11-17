/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { props as gridProps } from '../grid-props';
import { useGrid } from '../use-grid';

const COMPONENT_NAME = 'vcm-grid';

// 与Grid同结构，gap与columns数组中的数字按750稿
export const MGrid = defineComponent({
	name: COMPONENT_NAME,
	props: gridProps,
	setup(props, context) {
		return useGrid(props, context, { mobile: true });
	}
});
