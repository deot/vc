import { ref, watch } from 'vue';
import { isEqual } from 'lodash-es';
import { dayjs } from '../helper/dayjs';

interface RangeValueProps {
	value?: Date[];
	startDate?: Date;
	splitPanels?: boolean;
}

interface RangeValueOptions {
	// 一个面板的跨度：日期面板为月，月份、季度面板为年；右侧面板默认显示左侧的下一个
	unit: 'month' | 'year';
}

/**
 * 范围面板的值、左右面板显示的位置与选择状态
 * 	- 只点了起点时的选择状态只在面板内，不会发出，所以保留一份本地的值
 * 	- 外部改了值（如在输入框里键入）时跟随；与面板当前的值相同（面板自己发出、写回来的值）时不处理
 * @param props ~
 * @param options ~
 * @returns ~
 */
export const useRangeValue = (props: RangeValueProps, options: RangeValueOptions) => {
	const { unit } = options;
	const next = (date: Date) => dayjs(date).add(1, unit).toDate();
	// 起止是否落在同一个面板里（同月 / 同年）
	const isSamePanel = (start: Date, end: Date) => {
		return start.getFullYear() === end.getFullYear() && (unit === 'year' || start.getMonth() === end.getMonth());
	};
	const dates = ref<Date[]>([]);
	const leftPanelDate = ref<Date>(props.startDate || new Date());
	const rightPanelDate = ref<Date>(next(leftPanelDate.value));
	// marker：第一次点下的值
	const rangeState = ref<any>({ from: '', to: '', selecting: false, marker: null });

	const setValue = (value: Date[]) => {
		const [start, end] = value;
		dates.value = value;
		leftPanelDate.value = start || leftPanelDate.value;
		// 左右面板不联动、且起止不在同一个面板里时，右侧显示结束值所在的位置
		rightPanelDate.value = props.splitPanels && start && end && !isSamePanel(start, end) ? end : next(leftPanelDate.value);
		rangeState.value = { from: start || '', to: end || '', selecting: false, marker: null };
	};

	setValue(props.value!);
	watch(() => props.value!, v => !isEqual(v, dates.value) && setValue(v));

	return { dates, leftPanelDate, rightPanelDate, rangeState };
};
