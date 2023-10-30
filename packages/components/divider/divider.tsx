/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { props as dividerProps } from './divider-props';

const COMPONENT_NAME = 'vc-divider';

export const Divider = defineComponent({
	name: COMPONENT_NAME,
	props: dividerProps,
	setup(props, { slots }) {
		return () => {
			return (
				<div class="vc-divider">
					{ slots?.default?.() }
				</div>
			);
		};
	}
});
