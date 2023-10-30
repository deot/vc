/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { props as customerProps } from './customer-props';

const COMPONENT_NAME = 'vc-customer';

export const Customer = defineComponent({
	name: COMPONENT_NAME,
	props: customerProps,
	setup(props, { slots }) {
		return () => {
			return (
				<div class="vc-customer">
					{ slots?.default?.() }
				</div>
			);
		};
	}
});
