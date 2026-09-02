/** @jsxImportSource vue */

import type { RenderDateProps, RenderMonthProps, RenderWeekProps } from './types';

export const defaultRenderDate = ({ cell, today }: RenderDateProps) => {
	return <span class={{ 'is-selected': cell.value === today }}>{ cell.date }</span>;
};

export const defaultRenderMonth = ({ data }: RenderMonthProps) => {
	return (
		<div class="vc-calendar__month">
			<div>
				{ data.month }
				&nbsp;&nbsp;&nbsp;&nbsp;
				{ data.year }
			</div>
		</div>
	);
};

export const defaultRenderWeek = ({ data }: RenderWeekProps) => {
	return (
		<div class="vc-calendar__week">
			{
				data.map((item, index) => {
					return <span key={index}>{ item }</span>;
				})
			}
		</div>
	);
};
