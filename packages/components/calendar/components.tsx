/** @jsxImportSource vue */

import type { RenderDateProps, RenderMonthProps, RenderWeekProps } from './types';

export const defaultRenderDate = ({ cell, today }: RenderDateProps) => {
	return <span class={{ 'is-selected': cell.value === today }}>{ cell.date }</span>;
};

export const defaultRenderMonth = ({ month, year, lang, monthNames }: RenderMonthProps) => {
	return (
		<div class="vc-calendar__month">
			<div>
				{ monthNames[month]?.[lang] }
				&nbsp;&nbsp;&nbsp;&nbsp;
				{ year }
			</div>
		</div>
	);
};

export const defaultRenderWeek = ({ weekNames, lang }: RenderWeekProps) => {
	return (
		<div class="vc-calendar__week">
			{
				weekNames.map((item, index) => {
					return <span key={index}>{ item[lang] }</span>;
				})
			}
		</div>
	);
};
