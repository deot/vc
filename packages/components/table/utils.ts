import { VcError } from '../vc/index';
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
 * @param columns
 */
export const computeGridTemplateColumns = (columns: any[] = []) => {
	return columns
		.map((column: any, index: number) => {
			const width = column.realWidth || column.width || 80;
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

/**
 * ~
 * @param columns ~
 * @param columnId ~
 * @returns ~
 */
export const getColumnById = (columns: any[], columnId: any) => {
	let column = null;
	columns.forEach((item) => {
		if (item.id === columnId) {
			column = item;
		}
	});
	return column;
};

/**
 * ~
 * @param columns ~
 * @param columnKey ~
 * @returns ~
 */
export const getColumnByKey = (columns: any, columnKey: any) => {
	let column = null;
	for (let i = 0; i < columns.length; i++) {
		const item = columns[i];
		if (item.columnKey === columnKey) {
			column = item;
			break;
		}
	}
	return column;
};

/**
 * ~
 * @param columns ~
 * @param cell ~
 * @returns ~
 */
export const getColumnByCell = (columns: any, cell: any) => {
	const matches = (cell.className || '').match(/vc-table_[^\s]+/gm);
	if (matches) {
		return getColumnById(columns, matches[0]);
	}
	return null;
};

/**
 * ~
 * @param e ~
 * @returns ~
 */
export const getCell = (e: any) => {
	let cell = e.target;

	while (cell && cell.tagName.toUpperCase() !== 'HTML') {
		if (cell.classList.contains('vc-table__td')) {
			return cell;
		}
		cell = cell.parentNode;
	}

	return null;
};
