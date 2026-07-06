import { VcError } from '../vc/index';
import type { TableColumnNode } from './table-column/table-column-node';
/**
 * 10px -> 10
 * 10 -> 10
 * @param v ~
 * @returns ~
 */
export const parseHeight = (v?: number | string): null | number => {
	if (typeof v === 'number') {
		return v;
	}
	if (v && typeof v === 'string') {
		if (/^\d+(?:px)?/.test(v)) {
			return parseInt(v, 10);
		}
		throw new VcError('table', 'Invalid Height');
	}
	return null;
};

export const parseWidth = (v?: number | string): null | number => {
	if (typeof v === 'number') {
		return v;
	}

	let v1: any;
	if (typeof v !== 'undefined') {
		v1 = parseInt(v, 10);
		if (isNaN(v1)) {
			v1 = null;
		}
	}
	return v1;
};

export const parseMinWidth = (v?: number | string): null | number => {
	if (typeof v === 'number') {
		return v;
	}
	let v1: any;
	if (typeof v !== 'undefined') {
		v1 = parseWidth(v);
		if (isNaN(v1)) {
			v1 = 80;
		}
	}
	return v1;
};

/**
 * 由叶子列生成 CSS Grid 的 grid-template-columns 值。
 * 最后一列 minmax 兜底，容器更宽时由其撑满。
 * @param columns 叶子列
 * @returns 模板值
 */
export const computeGridTemplateColumns = (columns: TableColumnNode[] = []) => {
	return columns
		.map((column, index) => {
			const { states } = column;
			const width = states.realWidth || states.width || 80;
			return index === columns.length - 1
				? `minmax(${width}px, 1fr)`
				: `${width}px`;
		})
		.join(' ');
};

/**
 * 行 -> 唯一key
 * @param row 表格行数据
 * @param primaryKey 行主键字段名或取值函数
 * @returns 行的唯一标识值
 */
export const getRowValue = (row: any, primaryKey: any) => {
	if (row.__KEY__) return row.__KEY__;
	if (!row) throw new VcError('table', 'row is required when get row identity');
	if (typeof primaryKey === 'string') {
		if (!primaryKey.includes('.')) {
			return row[primaryKey];
		}
		const key = primaryKey.split('.');
		let current = row;
		for (let i = 0; i < key.length; i++) {
			current = current[key[i]];
		}
		return current;
	} else if (typeof primaryKey === 'function') {
		return primaryKey.call(null, row);
	}
};

/**
 * ~
 * @param array ~
 * @param primaryKey ~
 * @returns ~
 */
export const getValuesMap = (array: any[] = [], primaryKey: any) => {
	const arrayMap = {};
	array.forEach((row, index) => {
		arrayMap[getRowValue(row, primaryKey)] = { row, index };
	});
	return arrayMap;
};
