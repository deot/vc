/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { props as calendarProps } from './calendar-props';

const COMPONENT_NAME = 'vc-calendar';

export const Calendar = defineComponent({
	name: COMPONENT_NAME,
	props: calendarProps,
	setup(props, { slots }) {
		return () => {
			return (
				<div class="vc-calendar">
					{ slots?.default?.() }
				</div>
			);
		};
	}
});
