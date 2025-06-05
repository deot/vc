import { VcError } from '../vc/index';
/**
 * 10px -> 10
 * 10 -> 10
 * @param height ~
 * @returns ~
 */
export const parseHeight = (height) => {
	if (typeof height === 'number') {
		return height;
	}
	if (height && typeof height === 'string') {
		if (/^\d+(?:px)?/.test(height)) {
			return parseInt(height, 10);
		}
		throw new VcError('table', 'Invalid Height');
	}
	return null;
};

export const parseWidth = (width) => {
	if (width !== undefined) {
		width = parseInt(width, 10);
		if (isNaN(width)) {
			width = null;
		}
	}
	return width;
};

export const parseMinWidth = (minWidth) => {
	if (typeof minWidth !== 'undefined') {
		minWidth = parseWidth(minWidth);
		if (isNaN(minWidth)) {
			minWidth = 80;
		}
	}
	return minWidth;
};

/**
 * 行 -> 唯一key
 * @param row ~
 * @param rowKey ~
 * @returns ~
 */
export const getRowIdentity = (row, rowKey) => {
	if (row.__KEY__) return row.__KEY__;
	if (!row) throw new VcError('table', 'row is required when get row identity');
	if (typeof rowKey === 'string') {
		if (!rowKey.includes('.')) {
			return row[rowKey];
		}
		const key = rowKey.split('.');
		let current = row;
		for (let i = 0; i < key.length; i++) {
			current = current[key[i]];
		}
		return current;
	} else if (typeof rowKey === 'function') {
		return rowKey.call(null, row);
	}
};

/**
 * ~
 * @param root ~
 * @param cb ~
 * @param opts ~
 */
export const walkTreeNode = (root, cb, opts = {}) => {
	const {
		childrenKey = 'children',
		lazyKey = 'hasChildren',
		level: baseLevel = 0
	} = opts as any;

	const isNil = array => !(Array.isArray(array) && array.length);

	/**
	 *
	 * @param parent ~
	 * @param children ~
	 * @param level ~
	 */
	function _walker(parent, children, level) {
		cb(parent, children, level);
		children.forEach((item) => {
			if (item[lazyKey]) {
				cb(item, null, level + 1);
				return;
			}
			const $children = item[childrenKey];
			if (!isNil($children)) {
				_walker(item, $children, level + 1);
			}
		});
	}

	root.forEach((item) => {
		if (item[lazyKey]) {
			cb(item, null, baseLevel);
			return;
		}
		const children = item[childrenKey];
		if (!isNil(children)) {
			_walker(item, children, baseLevel);
		}
	});
};

/**
 * ~
 * @param array ~
 * @param rowKey ~
 * @returns ~
 */
export const getKeysMap = (array: any[] = [], rowKey) => {
	const arrayMap = {};
	array.forEach((row, index) => {
		arrayMap[getRowIdentity(row, rowKey)] = { row, index };
	});
	return arrayMap;
};

/**
 * ~
 * @param columns ~
 * @param columnId ~
 * @returns ~
 */
export const getColumnById = (columns, columnId) => {
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
export const getColumnByKey = (columns, columnKey) => {
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
 * @param table ~
 * @param cell ~
 * @returns ~
 */
export const getColumnByCell = (table, cell) => {
	const matches = (cell.className || '').match(/vc-table_[^\s]+/gm);
	if (matches) {
		return getColumnById(table, matches[0]);
	}
	return null;
};

/**
 * ~
 * @param event ~
 * @returns ~
 */
export const getCell = (event) => {
	let cell = event.target;

	while (cell && cell.tagName.toUpperCase() !== 'HTML') {
		if (cell.tagName.toUpperCase() === 'TD') {
			return cell;
		}
		cell = cell.parentNode;
	}

	return null;
};

export const flattenData = (data, opts: any = {}) => {
	const result: any = [];
	data.forEach((item) => {
		if (item.children) {
			const { children, ...rest } = item;
			opts.parent
				? result.push(...[opts.cascader ? item : rest, ...flattenData(children, opts)])
				: result.push(...flattenData(children));
		} else {
			result.push(item);
		}
	});
	return result;
};
