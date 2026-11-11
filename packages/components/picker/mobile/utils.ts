import { cloneDeep } from 'lodash-es';
import type { PickerColumn, PickerData, PickerSource, PickerValue } from '../types';

export const isColumnGroup = (source: PickerSource = []) => {
	return Array.isArray(source[0]);
};

export const normalizeRow = (row: PickerData | PickerValue): PickerData => {
	return row && typeof row === 'object'
		? row as PickerData
		: { label: row, value: row };
};

export const getRowValue = (row?: PickerData) => row?.value;

export const getRowLabel = (row?: PickerData) => {
	return typeof row?.label !== 'undefined' ? row.label : row?.value;
};

/**
 * 从 index 起向两侧找最近的可选行（未设 disabled 的行）
 * @param column 列数据
 * @param index 起点，超出范围时取最近的端点
 * @param direction 距离相同时先找的一侧：1 向后（下），-1 向前（上）
 * @returns 行的索引；整列都被禁用时为 -1
 */
export const findEnabledIndex = (column: PickerColumn, index: number, direction = 1) => {
	const length = column.length;
	if (!length) return -1;
	const start = Math.min(Math.max(index, 0), length - 1);
	const step = direction < 0 ? -1 : 1;
	for (let distance = 0; distance < length; distance++) {
		const forward = start + distance * step;
		if (forward >= 0 && forward < length && !column[forward].disabled) return forward;
		const backward = start - distance * step;
		if (backward >= 0 && backward < length && !column[backward].disabled) return backward;
	}
	return -1;
};

/**
 * 值对应的行：值不在数据里时取第一个可选行，落在禁用行上时取最近的可选行；整列都被禁用时保持原行（不在数据里时为首行）
 * @param column 列数据
 * @param value 当前值
 * @returns 行；空列时为 undefined
 */
export const resolveRow = (column: PickerColumn, value: PickerValue) => {
	const index = column.findIndex(row => row.value === value);
	const enabled = findEnabledIndex(column, Math.max(index, 0));
	return enabled >= 0 ? column[enabled] : column[Math.max(index, 0)];
};

export const makeColumnData = (source?: PickerColumn): PickerColumn => {
	return (source || []).map((item) => {
		const row = normalizeRow(item);

		return {
			...row,
			label: getRowLabel(row),
			value: getRowValue(row),
			hasChildren: !!(row.children && row.children.length > 0),
			loading: false
		};
	});
};

export const getSelectedData = (
	value: PickerValue[] = [],
	source: PickerSource = []
) => {
	const label: any[] = [];
	const data: PickerData[] = [];

	if (source.length !== 0) {
		if (isColumnGroup(source)) {
			value.forEach((item, index) => {
				const column = source[index] as PickerColumn | undefined;
				if (!column) return;

				const target = column.map(normalizeRow).find(it => it.value === item);
				if (!target) return;

				data.push(target);
				label.push(getRowLabel(target));
			});
		} else {
			value.reduce((pre: PickerColumn, cur) => {
				const target = pre.map(normalizeRow).find(it => it.value === cur);
				if (!target) return [];

				data.push(target);
				label.push(getRowLabel(target));

				return target.children || [];
			}, source as PickerColumn);
		}
	}

	return cloneDeep({
		value,
		label,
		data
	});
};
