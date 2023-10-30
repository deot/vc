/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { props as expandProps } from './expand-props';

const COMPONENT_NAME = 'vc-expand';

export const Expand = defineComponent({
	name: COMPONENT_NAME,
	props: expandProps,
	setup(props, { slots }) {
		return () => {
			return (
				<div class="vc-expand">
					{ slots?.default?.() }
				</div>
			);
		};
	}
});
