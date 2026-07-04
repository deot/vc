import { concat, isEqualWith, pick } from 'lodash-es';
import { flattenData } from '../utils';
import type { Store } from '../store';

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

const COLUMN_SYNC_KEYS = ['id', 'hidden', 'label', 'prop', 'type'] as const;

export class Column {
	store: Store;

	_sync = {
		snapshot: [] as any[],
		suppressWatch: false
	};

	constructor(store: Store) {
		this.store = store;
	}

	insert(column: any, index: any, parent: any) {
		let array = this.store.states._columns;

		// 修改引用，column.children赋值
		if (parent) {
			array = parent.children;
			if (!array) {
				array = [];
				parent.children = array;
			}
		}

		if (typeof index !== 'undefined') {
			array.splice(index, 0, column);
		} else {
			array.push(column);
		}

		if (column.type === 'selection') {
			this.store.states.selectable = column.selectable;
			this.store.states.reserveSelection = column.reserveSelection;
		}

		if (this.store.table.exposed.isReady.value) {
			this.store.updateColumns();
			this.store.scheduleLayout();
		}
	}

	remove(column: any, parent: any) {
		let array = this.store.states._columns;
		if (parent) {
			array = parent.children || [];
		}
		if (array) {
			array.splice(array.indexOf(column), 1);
		}

		if (this.store.table.exposed.isReady.value) {
			this.store.updateColumns();
			this.store.scheduleLayout();
		}
	}

	/**
	 * 更新列派生状态（leftFixed/rightFixed/originColumns/headerRows）。
	 * 不调用 Block、不 emit。
	 */
	update() {
		const { states } = this.store;
		const _columns = states._columns || [];

		// selection 自动 fixed 的副作用作用在原始 _columns 上
		if (_columns[0] && _columns[0].type === 'selection' && !_columns[0].fixed) {
			const anyLeftFixed = _columns.some(column => column.fixed === true || column.fixed === 'left');
			if (anyLeftFixed) {
				_columns[0].fixed = true;
			}
		}

		// 基于可见树（剔除 hidden）派生 fixed 分组与 headerRows
		const visibleColumns = this.cloneVisibleTree(_columns);
		const leftFixedColumns = visibleColumns.filter(column => column.fixed === true || column.fixed === 'left');
		const rightFixedColumns = visibleColumns.filter(column => column.fixed === 'right');
		const notFixedColumns = visibleColumns.filter(column => !column.fixed);
		const originColumns = concat(leftFixedColumns, notFixedColumns, rightFixedColumns);
		const headerRows = columnsToRowsEffect(originColumns);

		states.leftFixedColumns = leftFixedColumns;
		states.notFixedColumns = notFixedColumns;
		states.rightFixedColumns = rightFixedColumns;
		states.originColumns = originColumns;
		states.headerRows = headerRows;
	}

	/**
	 * 基于 _columns 生成"可见树"：剔除 hidden 列。
	 * 仅克隆含 children 的父节点（避免 columnsToRowsEffect 把 colspan/level/rowspan
	 * 写回原列对象造成残留）；leaf 列保持原引用，以便 Layout 写回 realWidth/stickyStyle/stickyClass。
	 * @param arr 列集合
	 * @returns 可见列集合
	 */
	cloneVisibleTree(arr: any[]): any[] {
		const walk = (list: any[]): any[] => {
			const out: any[] = [];
			for (const column of list) {
				if (column.hidden) continue;
				if (column.children && column.children.length) {
					const children = walk(column.children);
					// 子列全隐藏时父分组也不渲染
					if (children.length === 0) continue;
					out.push({ ...column, children });
				} else {
					out.push(column);
				}
			}
			return out;
		};
		return walk(arr);
	}

	/**
	 * 向外部 emit update:columns。
	 * 暴露全部收集到的 leaf 列（含被隐藏的，带 hidden 标记），不做可见性过滤。
	 */
	syncToParent() {
		const flattenColumns = flattenData(this.store.states._columns);
		const columns = flattenColumns.map((column: any) => pick(column, COLUMN_SYNC_KEYS)) as any[];
		if (isEqualWith(columns.map(i => pick(i, COLUMN_SYNC_KEYS)), this._sync.snapshot.map(i => pick(i, COLUMN_SYNC_KEYS)))) return;
		this._sync.snapshot = columns;
		// 置位：本次 emit 会回流为外部写回，applyExternal 据此跳过，避免回环
		this._sync.suppressWatch = true;
		this.store.table.emit('update:columns', columns);
	}

	/**
	 * 处理外部对 v-model:columns 的写回：
	 * 	1) 按 id 把 hidden 回写到内部列对象（递归含 children，覆盖多级表头）；
	 * 	2) 按 id 对齐顺序重排顶层 _columns（缺失项按原相对顺序补在末尾，避免误丢列）。
	 * @param v 外部写回的列数组
	 */
	applyExternal(v: any[]) {
		if (this._sync.suppressWatch) {
			this._sync.suppressWatch = false;
			return;
		}
		const _columns = this.store.states._columns;
		if (!Array.isArray(v) || !v.length) return;

		// 1) 写 hidden（按 id，递归 children）
		const hiddenById = v.reduce((pre, e) => (e && e.id != null && pre.set(e.id, !!e.hidden), pre), new Map<string, boolean>());
		let hiddenChanged = false;
		const applyHidden = (list: any[]) => {
			for (const column of list) {
				if (hiddenById.has(column.id)) {
					const v1 = hiddenById.get(column.id)!;
					if (!!column.hidden !== v1) {
						column.hidden = v1;
						hiddenChanged = true;
					}
				}
				if (column.children && column.children.length) applyHidden(column.children);
			}
		};
		applyHidden(_columns);

		// 2) 重排顶层 _columns（多级表头下外部多为 leaf id，匹配不到顶层则跳过）
		const order = v.map((e: any) => e?.id).filter(Boolean) as string[];
		const idToCol = _columns.reduce((pre, column) => (pre.set(column.id, column), pre), new Map<string, any>());
		const used = new Set<any>();
		const reordered: any[] = [];
		for (const id of order) {
			const column = idToCol.get(id);
			if (column && !used.has(column)) {
				reordered.push(column);
				used.add(column);
			}
		}
		for (const column of _columns) if (!used.has(column)) reordered.push(column);

		const orderChanged = !(reordered.length === _columns.length && reordered.every((column, i) => column === _columns[i]));
		orderChanged && (this.store.states._columns = reordered);

		if (orderChanged || hiddenChanged) {
			this.store.updateColumns();
			this.store.scheduleLayout();
		}
	}
}
