/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { props as popoverProps } from './popover-props';

const COMPONENT_NAME = 'vc-popover';

export const Popover = defineComponent({
	name: COMPONENT_NAME,
	props: popoverProps,
	setup(props, { slots }) {
		return () => {
			return (
				<div class="vc-popover">
					{ slots?.default?.() }
				</div>
			);
		};
	}
});
