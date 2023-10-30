/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { props as printProps } from './print-props';

const COMPONENT_NAME = 'vc-print';

export const Print = defineComponent({
	name: COMPONENT_NAME,
	props: printProps,
	setup(props, { slots }) {
		return () => {
			return (
				<div class="vc-print">
					{ slots?.default?.() }
				</div>
			);
		};
	}
});
