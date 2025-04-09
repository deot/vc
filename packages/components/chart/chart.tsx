/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { props as chartProps } from './chart-props';

const COMPONENT_NAME = 'vc-chart';

export const Chart = defineComponent({
	name: COMPONENT_NAME,
	props: chartProps,
	setup(props, { slots }) {
		return () => {
			return (
				<div class="vc-chart">
					{ slots?.default?.() }
				</div>
			);
		};
	}
});
