/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { props as echartsProps } from './echarts-props';

const COMPONENT_NAME = 'vc-echarts';

export const Echarts = defineComponent({
	name: COMPONENT_NAME,
	props: echartsProps,
	setup(props, { slots }) {
		return () => {
			return (
				<div class="vc-echarts">
					{ slots?.default?.() }
				</div>
			);
		};
	}
});
