/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { props as timelineProps } from './timeline-props';

const COMPONENT_NAME = 'vc-timeline';

export const Timeline = defineComponent({
	name: COMPONENT_NAME,
	props: timelineProps,
	setup(props, { slots }) {
		return () => {
			return (
				<div class="vc-timeline">
					{ slots?.default?.() }
				</div>
			);
		};
	}
});
