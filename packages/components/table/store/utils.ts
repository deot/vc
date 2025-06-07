const getAllColumns = (columns: any[]) => {
	const result: any[] = [];
	columns.forEach((column: any) => {
		if (column.children) {
			result.push(column);
			result.push(...getAllColumns(column.children));
		} else {
			result.push(column);
		}
	});
	return result;
};

// 这是一个不纯的函数，遍历是会被column添加level/colSpan/rowSpan
export const columnsToRowsEffect = (v: any[]) => {
	let maxLevel = 1;
	const traverse = (column: any, parent?: any) => {
		if (parent) {
			column.level = parent.level + 1;
			if (maxLevel < column.level) {
				maxLevel = column.level;
			}
		}
		if (column.children) {
			let colSpan = 0;
			column.children.forEach((subColumn: any) => {
				traverse(subColumn, column);
				colSpan += subColumn.colSpan;
			});
			column.colSpan = colSpan;
		} else {
			column.colSpan = 1;
		}
	};

	v.forEach((column) => {
		column.level = 1;
		traverse(column);
	});

	const rows: any[] = [];
	for (let i = 0; i < maxLevel; i++) {
		rows.push([]);
	}

	const allColumns = getAllColumns(v);

	allColumns.forEach((column) => {
		if (!column.children) {
			column.rowSpan = maxLevel - column.level + 1;
		} else {
			column.rowSpan = 1;
		}
		rows[column.level - 1].push(column);
	});

	return rows;
};

export const flattenData = (data: any[], opts: any = {}) => {
	const result: any = [];
	data.forEach((item: any) => {
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

/**
 * ~
 * @param root ~
 * @param cb ~
 * @param opts ~
 */
export const walkTreeNode = (root: any, cb: any, opts = {}) => {
	const {
		childrenKey = 'children',
		lazyKey = 'hasChildren',
		level: baseLevel = 0
	} = opts as any;

	const isNil = (array: any) => !(Array.isArray(array) && array.length);

	/**
	 *
	 * @param parent ~
	 * @param children ~
	 * @param level ~
	 */
	function _walker(parent: any, children: any, level: number) {
		cb(parent, children, level);
		children.forEach((item: any) => {
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

	root.forEach((item: any) => {
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
