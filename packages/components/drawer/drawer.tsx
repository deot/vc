/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { props as drawerProps } from './drawer-props';

const COMPONENT_NAME = 'vc-drawer';

export const Drawer = defineComponent({
	name: COMPONENT_NAME,
	props: drawerProps,
	setup(props, { slots }) {
		return () => {
			return (
				<div class="vc-drawer">
					{ slots?.default?.() }
				</div>
			);
		};
	}
});
