import { toRaw } from 'vue';
import { getRowValue } from '../../utils';
import type { TableColumnRenderData, TableColumnNode } from '../../table-column/table-column-node';
import type { Store } from '../store';

type SpanMethod = (
	data: Pick<TableColumnRenderData, 'row' | 'column' | 'rowIndex' | 'columnIndex'>
) => number[] | { rowspan?: number; colspan?: number } | undefined;

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
 * 	- 含合并的块标记 hasMerge，cells 不预构建（由 Block#getCells 在块进入渲染窗口时按 spans/skip 懒构建）；
 * 	- spans: key(rowIndex * columnCount + columnIndex) -> { rowspan, colspan }，仅含 anchor；
 * 	- skip: 被合并覆盖（或 span 归零剔除）的格子 key 集合；
 * 	- covers: rowIndex -> 覆盖该行的合并 anchor 坐标（rowspan > 1，不含 anchor 本行），供 hover 关联高亮。
 * @param data 当前数据（外部已完成排序/过滤）
 * @param columns 叶子列
 * @param getSpan ({ row, column, rowIndex, columnIndex }) => [rowspan, colspan] | { rowspan, colspan }
 * @returns 合并计划，形如 { blocks: [{ start, end, hasMerge? }], covers, spans, skip }
 */
export const computeMergePlan = (data: any[], columns: TableColumnNode[], getSpan: SpanMethod) => {
	const rowCount = data.length;
	const columnCount = columns.length;

	let spans: Map<number, { rowspan: number; colspan: number }> | null = null;
	let skip: Set<number> | null = null;
	let reach: number[] | null = null;
	let mergedRows: Set<number> | null = null;

	for (let r = 0; r < rowCount; r++) {
		for (let c = 0; c < columnCount; c++) {
			const key = r * columnCount + c;
			if (skip && skip.has(key)) continue;
			const v = normalizeSpan(getSpan({
				row: data[r],
				column: columns[c].states,
				rowIndex: r,
				columnIndex: c
			}));
			if (v.rowspan === 1 && v.colspan === 1) continue;
			if (!spans) {
				spans = new Map();
				skip = new Set();
				reach = Array.from({ length: rowCount }, (_, i) => i);
				mergedRows = new Set();
			}
			if (v.rowspan < 1 || v.colspan < 1) {
				skip!.add(key);
				mergedRows!.add(r);
				continue;
			}
			const rowspan = Math.min(v.rowspan, rowCount - r);
			const colspan = Math.min(v.colspan, columnCount - c);
			if (rowspan === 1 && colspan === 1) continue;

			spans.set(key, { rowspan, colspan });
			for (let i = r; i < r + rowspan; i++) {
				mergedRows!.add(i);
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
		return { blocks, covers: null, spans: null, skip: null };
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
		for (let r = block.start; r <= block.end; r++) {
			if (mergedRows!.has(r)) {
				block.hasMerge = true;
				break;
			}
		}
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

	return { blocks, covers: covers.size ? covers : null, spans, skip };
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

	// 块 -> cells 记忆化（key 为 list item 的 raw 对象）；list 重组 / 列变化时整体重置
	_cells = new WeakMap<object, any[]>();

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
	 * 按 getSpan 合并计划重组 states.list：为合并块标记 hasMerge，并写入 rowStart。
	 * cells 不在此处构建，由 getCells 在块进入渲染窗口时按需构建（避免虚拟化前全量构建）。
	 */
	rebuildMergeList() {
		this._cells = new WeakMap();
		const { getSpan, primaryKey } = this.store.table.props;
		const { data, columns, list } = this.store.states;
		if (typeof getSpan !== 'function' || !data.length || !columns.length) return;

		const columnsKey = columns.map(column => column.states.id).join(',');
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
				hasMerge: block.hasMerge,
				rowStart: block.start
			};
		});
	}

	/**
	 * 块级 cells 懒构建（仅发生在进入渲染窗口的块上），按块记忆化：
	 * 	- 合并块：按 plan 的 spans/skip 求 rowspan/colspan，被覆盖格子剔除；
	 * 	- 普通块（含无 getSpan 场景）：合成 1×1。
	 * @param block states.list 中的块
	 * @returns 一维 cells（坐标 + span）
	 */
	getCells(block: any) {
		const raw = toRaw(block);
		let cells = this._cells.get(raw);
		if (cells) return cells;

		const columnCount = this.store.states.columns.length;
		const plan = this._cache.plan;
		cells = [];
		if (block.hasMerge && plan?.spans) {
			const start = block.rowStart;
			const end = start + block.rows.length - 1;
			for (let r = start; r <= end; r++) {
				for (let c = 0; c < columnCount; c++) {
					const key = r * columnCount + c;
					if (plan.skip.has(key)) continue;
					const span = plan.spans.get(key);
					cells.push({
						rowIndex: r,
						columnIndex: c,
						rowspan: span?.rowspan || 1,
						colspan: span?.colspan || 1
					});
				}
			}
		} else {
			const rows = block.rows;
			for (let i = 0; i < rows.length; i++) {
				for (let c = 0; c < columnCount; c++) {
					cells.push({ rowIndex: rows[i].index, columnIndex: c, rowspan: 1, colspan: 1 });
				}
			}
		}
		this._cells.set(raw, cells);
		return cells;
	}

	getCoverAnchors(rowIndex: number) {
		return this._cache.plan?.covers?.get(rowIndex) || [];
	}
}
