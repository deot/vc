/** @jsxImportSource vue */

import { defineComponent, ref } from 'vue';
import { nextYear, prevYear } from '../helper/date-utils';
import { props as dateProps } from './base-date-props';
import { Confirm, ShortcutsSelect, MonthTable, DateHeader } from './base';

const isEqualYear = (value: Date[]) => {
	if (!value[0] || !value[1]) { return false; }
	const startYear = value[0].getFullYear();
	const endYear = value[1].getFullYear();
	return startYear === endYear;
};

const COMPONENT_NAME = 'vc-monthrange-panel';

export const MonthRangePanel = defineComponent({
	name: COMPONENT_NAME,
	props: {
		...dateProps,
		confirm: {
			type: Boolean,
			default: false
		},
		splitPanels: {
			type: Boolean,
			default: true
		},
	},
	emits: [
		'pick',
		'clear',
		'ok'
	],
	setup(props, { emit }) {
		const dates = ref(props.value!);
		const leftPanelDate = ref(props.value![0] || props.startDate || new Date());
		const rightPanelDate = ref(
			props.splitPanels && !isEqualYear(props.value!)
				? props.value![1] || nextYear(leftPanelDate.value)
				: nextYear(leftPanelDate.value)
		);
		const rangeState = ref<any>({
			from: props.value![0] || '',
			to: props.value![1] || '',
			selecting: false,
			marker: null, // 第一次点下的季度
		});
		const currentView = ref('monthrange');

		const handlePanelChange = (panelDate: Date, type: string, position: string) => {
			position === 'left'
				? (leftPanelDate.value = panelDate)
				: (rightPanelDate.value = panelDate);

			if (props.splitPanels) { // 左右面板不联动
				const panelYear = panelDate.getFullYear();
				const leftPanelYear = leftPanelDate.value.getFullYear();
				const rightPanelYear = rightPanelDate.value.getFullYear();
				switch (type) {
					case 'prev-year':
					case 'next-year':
						if (position === 'left' && panelYear >= rightPanelYear) {
							rightPanelDate.value = nextYear(rightPanelDate.value);
						} else if (position === 'right' && panelYear <= leftPanelYear) {
							leftPanelDate.value = prevYear(leftPanelDate.value);
						}
						break;
					default:
						break;
				}
			} else {
				switch (type) {
					case 'prev-year':
						rightPanelDate.value = prevYear(rightPanelDate.value);
						break;
					case 'next-year':
						leftPanelDate.value = nextYear(leftPanelDate.value);
						break;
					default:
						break;
				}
			}
		};
		// 重新选择日期范围后需要重新选择时间范围
		const handlePick = (value: any) => {
			const { selecting, from, marker } = rangeState.value;
			if (!selecting) {
				dates.value = [];
				rangeState.value = {
					from: value,
					to: '',
					selecting: true,
					marker: value
				};
			} else {
				rangeState.value = {
					from: value < marker ? value : from,
					to: value < marker ? marker : value,
					selecting: false,
					marker
				};
			}

			if (rangeState.value.from && rangeState.value.to) {
				// from && to 都已选择，对外发送事件
				const leftDate = rangeState.value.from;
				const rightDate = rangeState.value.to;
				dates.value = [leftDate, rightDate];
				emit('pick', dates.value);
			}
		};

		const handleRangeChange = (value: Date) => {
			const { from, marker } = rangeState.value;
			if (rangeState.value.selecting && value.getTime() != from.getTime()) {
				rangeState.value = {
					from: value < marker ? value : marker,
					to: value < marker ? marker : value,
					selecting: true,
					marker
				};
			}
		};

		const handleClear = () => {
			emit('clear');
		};

		const handleOK = () => {
			emit('ok', dates.value);
		};

		const handleShortcutPick = (value: Date[]) => {
			if (props.disabledDate(value[0]) || props.disabledDate(value[1])) {
				return;
			}
			leftPanelDate.value = value[0];
			rightPanelDate.value = value[1];
			handlePick(value[0]);
			handlePick(value[1]);
			dates.value = value;
		};

		return () => {
			return (
				<div class="vc-monthrange-panel">
					{
						props.shortcuts && props.shortcuts.length > 0 && (
							<div style="width: 100px">
								<ShortcutsSelect
									config={props.shortcuts}
									onPick={handleShortcutPick}
								/>
							</div>
						)
					}
					<div class="vc-monthrange-panel__body">
						<div class="vc-monthrange-panel__table">
							<div class="vc-monthrange-panel__content is-left">
								<DateHeader
									currentView={currentView.value}
									panelDate={leftPanelDate.value}
									showNext={props.splitPanels}
									onChange={(panelDate, type) => handlePanelChange(panelDate, type, 'left')}
								/>
								<MonthTable
									value={dates.value}
									panelDate={leftPanelDate.value}
									disabledDate={props.disabledDate}
									rangeState={rangeState.value}
									onPick={value => handlePick(value)}
									// @ts-ignore
									onRangeChange={handleRangeChange}
								/>
							</div>
							<div class="vc-monthrange-panel__content is-right">
								<DateHeader
									currentView={currentView.value}
									panelDate={rightPanelDate.value}
									showNext={props.splitPanels}
									onChange={(panelDate, type) => handlePanelChange(panelDate, type, 'right')}
								/>
								<MonthTable
									value={dates.value}
									panelDate={rightPanelDate.value}
									disabledDate={props.disabledDate}
									rangeState={rangeState.value}
									onPick={value => handlePick(value)}
									// @ts-ignore
									onRangeChange={handleRangeChange}
								/>
							</div>
						</div>
						{
							props.confirm && (
								<Confirm
									showTime={false}
									currentView={currentView.value}
									// @ts-ignore
									onClear={handleClear}
									onOk={handleOK}
								/>
							)
						}
					</div>
				</div>
			);
		};
	}
});
