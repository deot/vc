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

// 这是一个不纯的函数，遍历是会被column添加level/colspan/rowspan
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
			let colspan = 0;
			column.children.forEach((subColumn: any) => {
				traverse(subColumn, column);
				colspan += subColumn.colspan;
			});
			column.colspan = colspan;
		} else {
			column.colspan = 1;
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
			column.rowspan = maxLevel - column.level + 1;
		} else {
			column.rowspan = 1;
		}
		rows[column.level - 1].push(column);
	});

	return rows;
};

/**
 * 归一化 getSpan 的返回值：[rowspan, colspan] | { rowspan, colspan } -> { rowspan, colspan }
 * @param v getSpan 返回值
 * @returns ~
 */
export const normalizeSpan = (v: any) => {
	if (Array.isArray(v)) {
		return { rowspan: v[0] ?? 1, colspan: v[1] ?? 1 };
	}
	if (v && typeof v === 'object') {
		return { rowspan: v.rowspan ?? 1, colspan: v.colspan ?? 1 };
	}
	return { rowspan: 1, colspan: 1 };
};

/**
 * 基于 getSpan 预求值合并信息，产出"合并计划"：
 * 	- 以"行方向连续合并块"为最小单位切块（与虚拟化语义保持一致，块即 RecycleList 的最小渲染单位）；
 * 	- 含合并的块附带 cells[]（坐标 + span 的一维数组，被覆盖的格子已剔除），交给 TableMergeLayer 渲染；
 * 	- 不含合并的块 cells 为空，渲染层继续走原有 TableBodyRow 路径，保证回归零风险。
 * span 为 0（或负数）视为该格子被外部覆盖，不渲染。
 * @param data 当前数据（外部已完成排序/过滤）
 * @param columns 叶子列
 * @param getSpan ({ row, column, rowIndex, columnIndex }) => [rowspan, colspan] | { rowspan, colspan }
 * @returns 合并计划，形如 blocks: [{ start, end, cells? }]
 */
export const computeMergePlan = (data: any[], columns: any[], getSpan: any) => {
	const rowCount = data.length;
	const columnCount = columns.length;

	const spans = new Map<string, { rowspan: number; colspan: number }>();
	const skip = new Set<string>();
	// 每行向下联通的最远行号（用于切块）
	const reach: number[] = new Array(rowCount).fill(0);

	for (let r = 0; r < rowCount; r++) {
		reach[r] = Math.max(reach[r], r);
		for (let c = 0; c < columnCount; c++) {
			const key = `${r}:${c}`;
			if (skip.has(key)) continue;
			const v = normalizeSpan(getSpan({
				row: data[r],
				column: columns[c],
				rowIndex: r,
				columnIndex: c
			}));
			if (v.rowspan < 1 || v.colspan < 1) {
				// 0 视为被覆盖：由外部保证有 anchor 覆盖该区域
				skip.add(key);
				continue;
			}
			const rowspan = Math.min(v.rowspan, rowCount - r);
			const colspan = Math.min(v.colspan, columnCount - c);
			if (rowspan === 1 && colspan === 1) continue;

			spans.set(key, { rowspan, colspan });
			for (let i = r; i < r + rowspan; i++) {
				for (let j = c; j < c + colspan; j++) {
					if (i === r && j === c) continue;
					skip.add(`${i}:${j}`);
				}
			}
			reach[r] = Math.max(reach[r], r + rowspan - 1);
		}
	}

	// 按联通区间切块
	const blocks: any[] = [];
	let start = 0;
	let end = 0;
	for (let r = 0; r < rowCount; r++) {
		end = Math.max(end, reach[r]);
		if (r === end) {
			blocks.push({ start, end });
			start = r + 1;
			end = r + 1;
		}
	}

	// 为含合并的块生成 cells（含 colspan 的单行块也走 cells）
	blocks.forEach((block: any) => {
		let hasMerge = block.end > block.start;
		const cells: any[] = [];
		for (let r = block.start; r <= block.end; r++) {
			for (let c = 0; c < columnCount; c++) {
				const key = `${r}:${c}`;
				if (skip.has(key)) {
					hasMerge = true;
					continue;
				}
				const span = spans.get(key);
				if (span) hasMerge = true;
				cells.push({
					rowIndex: r,
					columnIndex: c,
					rowspan: span?.rowspan || 1,
					colspan: span?.colspan || 1
				});
			}
		}
		if (hasMerge) block.cells = cells;
	});

	return { blocks };
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
