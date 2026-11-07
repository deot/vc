/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { props as tabsPaneProps } from '../tabs-pane-props';
import { useTabsPane } from '../use-tabs-pane';

const COMPONENT_NAME = 'vcm-tabs-pane';

export const MTabsPane = defineComponent({
	name: COMPONENT_NAME,
	props: tabsPaneProps,
	setup(props, { slots }) {
		const tabsPane = useTabsPane(props);
		return () => {
			return (
				<div
					class="vcm-tabs-pane"
					style={tabsPane.style.value}
					// @ts-ignore
					name={tabsPane.currentValue.value}
				>
					{ tabsPane.isReady.value && slots.default?.() }
				</div>
			);
		};
	}
});
