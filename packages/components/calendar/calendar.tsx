/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { props as calendarProps } from './calendar-props';
import { Button } from '../button';
import { Scroller } from '../scroller';
import { useCalendar } from './use-calendar';

const COMPONENT_NAME = 'vc-calendar';

export const Calendar = defineComponent({
	name: COMPONENT_NAME,
	props: calendarProps,
	emits: ['update:modelValue', 'update:panelDate', 'update:mode', 'change', 'date-click'],
	setup(props, context) {
		return useCalendar(props, context, { Button, Scroller });
	}
});
