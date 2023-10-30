/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { props as tabsProps } from './tabs-props';

const COMPONENT_NAME = 'vc-tabs';

export const Tabs = defineComponent({
	name: COMPONENT_NAME,
	props: tabsProps,
	setup(props, { slots }) {
		return () => {
			return (
				<div class="vc-tabs">
					{ slots?.default?.() }
				</div>
			);
		};
	}
});
