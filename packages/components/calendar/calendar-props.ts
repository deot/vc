import type { ExtractPropTypes, PropType } from 'vue';
import { monthNames, weekNames } from './constants';
import { defaultRenderDate, defaultRenderMonth, defaultRenderWeek } from './components';
import type {
	CalendarAdjacentWeeks,
	CalendarLang,
	CalendarName,
	CalendarRender,
	RenderDateProps,
	RenderMonthProps,
	RenderWeekProps
} from './types';

export const props = {
	renderDate: {
		type: Function as PropType<CalendarRender<RenderDateProps>>,
		default: defaultRenderDate
	},
	renderMonth: {
		type: Function as PropType<CalendarRender<RenderMonthProps>>,
		default: defaultRenderMonth
	},
	renderWeek: {
		type: Function as PropType<CalendarRender<RenderWeekProps>>,
		default: defaultRenderWeek
	},
	lang: {
		type: String as PropType<CalendarLang>,
		default: 'ch'
	},
	firstDayOfWeek: {
		type: Number,
		default: 1,
		validator: (value: number) => Number.isInteger(value) && value >= 1 && value <= 7
	},
	showAdjacentWeeks: {
		type: [Boolean, Array] as PropType<CalendarAdjacentWeeks>,
		default: () => [false, true],
		validator: (value: CalendarAdjacentWeeks) => {
			return typeof value === 'boolean'
				|| (Array.isArray(value) && value.length === 2 && value.every(item => typeof item === 'boolean'));
		}
	},
	monthNames: {
		type: Array as PropType<CalendarName[]>,
		default: () => monthNames
	},
	weekNames: {
		type: Array as PropType<CalendarName[]>,
		default: () => weekNames
	}
};

export type Props = ExtractPropTypes<typeof props>;
