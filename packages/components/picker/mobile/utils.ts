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

				const target = column.map(normalizeRow).find(it => it.value == item);
				if (!target) return;

				data.push(target);
				label.push(getRowLabel(target));
			});
		} else {
			value.reduce((pre: PickerColumn, cur) => {
				const target = pre.map(normalizeRow).find(it => it.value == cur);
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
