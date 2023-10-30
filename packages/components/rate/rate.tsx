/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { props as rateProps } from './rate-props';

const COMPONENT_NAME = 'vc-rate';

export const Rate = defineComponent({
	name: COMPONENT_NAME,
	props: rateProps,
	setup(props, { slots }) {
		return () => {
			return (
				<div class="vc-rate">
					{ slots?.default?.() }
				</div>
			);
		};
	}
});
