import { getRowValue } from '../../utils';
import type { Store } from '../store';

/**
 * 归一化 getSpan 的返回值：[rowspan, colspan] | { rowspan, colspan } -> { rowspan, colspan }
 * @param v getSpan 返回值
 * @returns 归一化后的 rowspan / colspan
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
 * 	- 含合并的块附带 cells[]（坐标 + span 的一维数组，被覆盖的格子已剔除），交给 TableGrid 渲染；
 * 	- 不含合并的块 cells 为空，渲染层按行合成 1×1 cells；
 * 	- covers: rowIndex -> 覆盖该行的合并 anchor 坐标（rowspan > 1，不含 anchor 本行），供 hover 关联高亮。
 * @param data 当前数据（外部已完成排序/过滤）
 * @param columns 叶子列
 * @param getSpan ({ row, column, rowIndex, columnIndex }) => [rowspan, colspan] | { rowspan, colspan }
 * @returns 合并计划，形如 { blocks: [{ start, end, cells? }], covers }
 */
export const computeMergePlan = (data: any[], columns: any[], getSpan: any) => {
	const rowCount = data.length;
	const columnCount = columns.length;

	let spans: Map<number, { rowspan: number; colspan: number }> | null = null;
	let skip: Set<number> | null = null;
	let reach: number[] | null = null;

	for (let r = 0; r < rowCount; r++) {
		for (let c = 0; c < columnCount; c++) {
			const key = r * columnCount + c;
			if (skip && skip.has(key)) continue;
			const v = normalizeSpan(getSpan({
				row: data[r],
				column: columns[c],
				rowIndex: r,
				columnIndex: c
			}));
			if (v.rowspan === 1 && v.colspan === 1) continue;
			if (!spans) {
				spans = new Map();
				skip = new Set();
				reach = Array.from({ length: rowCount }, (_, i) => i);
			}
			if (v.rowspan < 1 || v.colspan < 1) {
				skip!.add(key);
				continue;
			}
			const rowspan = Math.min(v.rowspan, rowCount - r);
			const colspan = Math.min(v.colspan, columnCount - c);
			if (rowspan === 1 && colspan === 1) continue;

			spans.set(key, { rowspan, colspan });
			for (let i = r; i < r + rowspan; i++) {
				for (let j = c; j < c + colspan; j++) {
					if (i === r && j === c) continue;
					skip!.add(i * columnCount + j);
				}
			}
			reach![r] = Math.max(reach![r], r + rowspan - 1);
		}
	}

	if (!spans) {
		const blocks: any[] = new Array(rowCount);
		for (let r = 0; r < rowCount; r++) blocks[r] = { start: r, end: r };
		return { blocks, covers: null };
	}

	const blocks: any[] = [];
	let start = 0;
	let end = 0;
	for (let r = 0; r < rowCount; r++) {
		end = Math.max(end, reach![r]);
		if (r === end) {
			blocks.push({ start, end });
			start = r + 1;
			end = r + 1;
		}
	}

	blocks.forEach((block: any) => {
		let hasMerge = block.end > block.start;
		const cells: any[] = [];
		for (let r = block.start; r <= block.end; r++) {
			for (let c = 0; c < columnCount; c++) {
				const key = r * columnCount + c;
				if (skip!.has(key)) {
					hasMerge = true;
					continue;
				}
				const span = spans!.get(key);
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

	const covers = new Map<number, any[]>();
	spans.forEach((span, key) => {
		if (span.rowspan <= 1) return;
		const r = Math.floor(key / columnCount);
		const c = key % columnCount;
		for (let i = r + 1; i < r + span.rowspan; i++) {
			let anchors = covers.get(i);
			if (!anchors) covers.set(i, anchors = []);
			anchors.push({ rowIndex: r, columnIndex: c });
		}
	});

	return { blocks, covers: covers.size ? covers : null };
};

/**
 * 虚拟化块编排：list 构建、getSpan 合并计划缓存与 list 重组。
 */
export class Block {
	store: Store;

	_cache = {
		data: null as any,
		length: 0,
		columnsKey: '',
		getSpan: null as any,
		plan: null as any
	};

	constructor(store: Store) {
		this.store = store;
	}

	buildInitialList(data: any[]) {
		const { primaryKey } = this.store.table.props;
		return data.map((row, index) => {
			const id = primaryKey ? getRowValue(row, primaryKey) : index;
			return {
				id: typeof id === 'undefined' ? index : id,
				rows: [{ index, data: row }],
				rowStart: index,
				expand: false
			};
		});
	}

	/**
	 * 按 getSpan 合并计划重组 states.list：为合并块生成 cells，并写入 rowStart。
	 * 只有存在合并时，才全量构建cells, 主要目的是一个block内含多少个row数据；（性能后续再优化）
	 */
	rebuildMergeList() {
		const { getSpan, primaryKey } = this.store.table.props;
		const { data, columns, list } = this.store.states;
		if (typeof getSpan !== 'function' || !data.length || !columns.length) return;

		const columnsKey = columns.map((column: any) => column.id).join(',');
		const cache = this._cache;
		let plan = cache.plan;
		if (
			!plan
			|| cache.data !== data
			|| cache.length !== data.length
			|| cache.columnsKey !== columnsKey
			|| cache.getSpan !== getSpan
		) {
			plan = computeMergePlan(data, columns, getSpan);
			this._cache = { data, length: data.length, columnsKey, getSpan, plan };
		}

		const flatRows = list.reduce((pre: any[], block: any) => (pre.push(...block.rows), pre), []);
		if (flatRows.length !== data.length) return;

		this.store.states.list = plan.blocks.map((block: any) => {
			const rows = flatRows.slice(block.start, block.end + 1);
			const id = primaryKey
				? rows.map((row: any) => getRowValue(row.data, primaryKey)).join(',')
				: block.start;
			return {
				id: typeof id === 'undefined' ? block.start : id,
				rows,
				expand: false,
				cells: block.cells,
				rowStart: block.start
			};
		});
	}

	getCoverAnchors(rowIndex: number) {
		return this._cache.plan?.covers?.get(rowIndex) || [];
	}
}
