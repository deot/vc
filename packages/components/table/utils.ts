import { VcError } from '../vc/index';
import type { TableColumnNode } from './table-column/table-column-node';
/**
 * 数字长度换算成 px 并取整（布局按整数 px 累加，避免固定列之间出现半像素的缝）；字符串原样返回
 * @param v 长度
 * @param unit 1 个单位的 px（store.states.unit）：桌面端为 1，移动端的数字为 750 稿
 * @returns ~
 */
export const scaleLength = <T>(v: T, unit = 1): T => {
	return (typeof v === 'number' && unit !== 1 ? Math.round(v * unit) : v) as T;
};

/**
 * 10px -> 10
 * 10 -> 10
 * @param v ~
 * @param unit 见 scaleLength
 * @returns ~
 */
export const parseHeight = (v?: number | string, unit = 1): null | number => {
	if (typeof v === 'number') {
		return scaleLength(v, unit);
	}
	if (v && typeof v === 'string') {
		if (/^\d+(?:px)?/.test(v)) {
			return parseInt(v, 10);
		}
		throw new VcError('table', 'Invalid Height');
	}
	return null;
};

export type TableRowHeight = string | number | ((data: { row: any; rowIndex: number }) => string | number | undefined);

/**
 * 某一行的行高：固定值直接解析，函数按行调用
 * @param rowHeight table 的 rowHeight
 * @param row 行数据
 * @param rowIndex 行号
 * @param unit 见 scaleLength
 * @returns 行高（px）；null 表示该行由内容撑开
 */
export const getRowHeight = (rowHeight: TableRowHeight | undefined, row: any, rowIndex: number, unit = 1): null | number => {
	return parseHeight(typeof rowHeight === 'function' ? rowHeight({ row, rowIndex }) : rowHeight, unit);
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
 * 表格内的撑满由 Layout 写进 realWidth（撑满列不一定是最后一列，如最后一列为右固定列）；
 * 最后一列的 minmax 只作兜底，供独立使用（没有 Layout）的 TableGrid 在容器更宽时撑满。
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
