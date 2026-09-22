import { concat, isEqual, isEqualWith, pick } from 'lodash-es';
import type { Nullable } from '@deot/helper-shared';
import type { TableColumnNode } from '../../table-column/table-column-node';
import { flattenColumnNodes } from '../utils';
import type { Store } from '../store';

/**
 * v-model:columns 的同步项（对外暴露的 leaf 列摘要）。
 */
export interface TableColumnSyncItem {
	id: string;
	hidden?: boolean;
	label?: string;
	prop?: string;
	type?: string;
}

const getAllColumns = (columns: TableColumnNode[]): TableColumnNode[] => {
	const result: TableColumnNode[] = [];
	columns.forEach((column) => {
		if (column.childNodes.length) {
			result.push(column);
			result.push(...getAllColumns(column.childNodes));
		} else {
			result.push(column);
		}
	});
	return result;
};

// 这是一个不纯的函数，遍历时会向 column.states 写入 level/colspan/rowspan
export const columnsToRowsEffect = (v: TableColumnNode[]) => {
	let maxLevel = 1;
	const traverse = (column: TableColumnNode, parent?: TableColumnNode) => {
		if (parent) {
			column.states.level = parent.states.level! + 1;
			if (maxLevel < column.states.level) {
				maxLevel = column.states.level;
			}
		}
		if (column.childNodes.length) {
			let colspan = 0;
			column.childNodes.forEach((subColumn) => {
				traverse(subColumn, column);
				colspan += subColumn.states.colspan;
			});
			column.states.colspan = colspan;
		} else {
			column.states.colspan = 1;
		}
	};

	v.forEach((column) => {
		column.states.level = 1;
		traverse(column);
	});

	const rows: TableColumnNode[][] = [];
	for (let i = 0; i < maxLevel; i++) {
		rows.push([]);
	}

	const allColumns = getAllColumns(v);

	allColumns.forEach((column) => {
		if (!column.childNodes.length) {
			column.states.rowspan = maxLevel - column.states.level! + 1;
		} else {
			column.states.rowspan = 1;
		}
		rows[column.states.level! - 1].push(column);
	});

	return rows;
};

const COLUMN_SYNC_KEYS = ['id', 'hidden', 'label', 'prop', 'type'] as const;

/**
 * 按列根元素在容器中的先后排序（即模板顺序）。
 * 不在容器内的列（卸载中、手工组装无实例）排在末尾并保持原相对顺序。
 * @param columns 同一层级的列节点
 * @param container 该层列元素所在的容器
 * @returns 排序后的新数组（无容器或已有序时返回原数组）
 */
const sortByDom = (columns: TableColumnNode[], container?: Nullable<Element>) => {
	if (!container || columns.length < 2) return columns;
	const getEl = (column: TableColumnNode) => {
		const el = column.instance?.vnode.el as Nullable<Element>;
		return el && el !== container && container.contains(el) ? el : null;
	};
	type Item = { column: TableColumnNode; el: Nullable<Element> };
	const compare = (a: Item, b: Item) => {
		if (!a.el || !b.el) return Number(!a.el) - Number(!b.el);
		if (a.el === b.el) return 0;
		return a.el.compareDocumentPosition(b.el) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
	};

	const items = columns.map(column => ({ column, el: getEl(column) }));
	// 常见情况已有序：相邻两两比较即可确认，不做完整排序
	if (items.every((item, index) => index === 0 || compare(items[index - 1], item) <= 0)) return columns;
	return items.sort(compare).map(item => item.column);
};

/**
 * 在模板顺序之上叠加外部顺序：已知列按外部顺序，新列跟在其模板中的前一列之后（无前一列时放最前）。
 * @param columns 按模板顺序排列的列节点
 * @param order 外部顺序（列 id）
 * @returns 排序后的新数组
 */
const applyOrder = (columns: TableColumnNode[], order: string[]) => {
	const rank = new Map(order.map((id, index) => [id, index]));
	const result = columns
		.filter(column => rank.has(column.states.id))
		.sort((a, b) => rank.get(a.states.id)! - rank.get(b.states.id)!);
	columns.forEach((column, index) => {
		if (rank.has(column.states.id)) return;
		const prev = columns[index - 1];
		result.splice(prev ? result.indexOf(prev) + 1 : 0, 0, column);
	});
	return result;
};

export class Column {
	store: Store;

	_sync = {
		snapshot: [] as TableColumnSyncItem[],
		suppressWatch: false,
		// 外部（v-model:columns）重排后的顶层顺序；与模板顺序一致时为 null，即跟随模板
		order: null as Nullable<string[]>
	};

	constructor(store: Store) {
		this.store = store;
	}

	/**
	 * 注册列：位置不取挂载时的下标，而是按 DOM 顺序整理
	 * （keyed diff 会倒序挂载新节点，挂载钩子的触发顺序不等于 DOM 顺序）。
	 * 首次挂载时仅收集，由 Table 挂载后统一整理。
	 * @param column 列节点
	 * @param parent 父列节点（多级表头）
	 */
	insert(column: TableColumnNode, parent?: TableColumnNode) {
		const array = parent ? parent.childNodes : this.store.states._columns;
		array.push(column);

		if (column.states.type === 'selection') {
			this.store.states.selectable = column.states.selectable;
			this.store.states.reserveSelection = !!column.states.reserveSelection;
		}

		if (this.store.table.exposed.isReady.value) {
			this.sort(parent);
			this.store.updateColumns();
			this.store.scheduleLayout();
		}
	}

	remove(column: TableColumnNode, parent?: TableColumnNode) {
		const array = parent ? parent.childNodes : this.store.states._columns;
		const index = array.indexOf(column);
		if (index > -1) {
			array.splice(index, 1);
		}

		if (this.store.table.exposed.isReady.value) {
			this.store.updateColumns();
			this.store.scheduleLayout();
		}
	}

	/**
	 * 按模板（DOM）顺序整理一层列；顶层存在外部顺序时再叠加外部顺序。
	 * @param parent 父列节点，省略时为顶层
	 * @returns 顺序是否变化
	 */
	sort(parent?: TableColumnNode) {
		const array = parent ? parent.childNodes : this.store.states._columns;
		const container = parent
			? parent.instance?.vnode.el as Nullable<Element>
			: this.store.table.exposed?.hiddenColumns?.value;

		let sorted = sortByDom(array, container);
		if (!parent && this._sync.order) {
			sorted = applyOrder(sorted, this._sync.order);
		}

		const changed = sorted.some((column, index) => column !== array[index]);
		changed && array.splice(0, array.length, ...sorted);
		return changed;
	}

	/**
	 * 整理整棵列树（首次挂载时列仅收集，由 Table 挂载后统一整理）。
	 * @returns 顺序是否变化
	 */
	sortTree() {
		const walk = (parent?: TableColumnNode): boolean => {
			let changed = this.sort(parent);
			const array = parent ? parent.childNodes : this.store.states._columns;
			array.forEach((column) => {
				if (column.childNodes.length) {
					changed = walk(column) || changed;
				}
			});
			return changed;
		};
		return walk();
	}

	/**
	 * 更新列派生状态（leftFixed/rightFixed/originColumns/headerRows）。
	 * 不调用 Block、不 emit。
	 */
	update() {
		const { states } = this.store;
		const _columns = states._columns || [];

		// selection 自动 fixed 的副作用作用在原始 _columns 上
		if (_columns[0] && _columns[0].states.type === 'selection' && !_columns[0].states.fixed) {
			const anyLeftFixed = _columns.some(column => column.states.fixed === true || column.states.fixed === 'left');
			if (anyLeftFixed) {
				_columns[0].states.fixed = true;
			}
		}

		// 基于可见树（剔除 hidden）派生 fixed 分组与 headerRows
		const visibleColumns = this.cloneVisibleTree(_columns);
		const leftFixedColumns = visibleColumns.filter(column => column.states.fixed === true || column.states.fixed === 'left');
		const rightFixedColumns = visibleColumns.filter(column => column.states.fixed === 'right');
		const notFixedColumns = visibleColumns.filter(column => !column.states.fixed);
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
	 * 仅克隆含子列的分组节点（避免 columnsToRowsEffect 把 colspan/level/rowspan
	 * 写回原列节点造成残留）；leaf 列保持原引用，以便 Layout 写回 realWidth/stickyStyle/stickyClass。
	 * @param arr 列节点集合
	 * @returns 可见列节点集合
	 */
	cloneVisibleTree(arr: TableColumnNode[]): TableColumnNode[] {
		const walk = (list: TableColumnNode[]): TableColumnNode[] => {
			const out: TableColumnNode[] = [];
			for (const column of list) {
				if (column.states.hidden) continue;
				if (column.childNodes.length) {
					const children = walk(column.childNodes);
					// 子列全隐藏时父分组也不渲染
					if (children.length === 0) continue;
					out.push(column.cloneNode(children));
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
		const flattenColumns = flattenColumnNodes(this.store.states._columns);
		const columns = flattenColumns.map(column => pick(column.states, COLUMN_SYNC_KEYS) as TableColumnSyncItem);
		if (isEqualWith(columns.map(i => pick(i, COLUMN_SYNC_KEYS)), this._sync.snapshot.map(i => pick(i, COLUMN_SYNC_KEYS)))) return;
		this._sync.snapshot = columns;
		// 置位：本次 emit 会回流为外部写回，applyExternal 据此跳过，避免回环
		this._sync.suppressWatch = true;
		this.store.table.emit('update:columns', columns);
	}

	/**
	 * 处理外部对 v-model:columns 的写回：
	 * 	1) 按 id 把 hidden 回写到内部列节点（递归含 childNodes，覆盖多级表头）；
	 * 	2) 按 id 记录顶层顺序并重排 _columns：与模板顺序一致时不记录（跟随模板），
	 * 	   否则外部顺序优先，缺失项（如新增列）跟在其模板中的前一列之后。
	 * @param v 外部写回的列数组
	 */
	applyExternal(v: TableColumnSyncItem[]) {
		if (this._sync.suppressWatch) {
			this._sync.suppressWatch = false;
			return;
		}
		const _columns = this.store.states._columns;
		if (!Array.isArray(v) || !v.length) return;

		// 1) 写 hidden（按 id，递归 childNodes）
		const hiddenById = v.reduce((pre, e) => (e && e.id != null && pre.set(e.id, !!e.hidden), pre), new Map<string, boolean>());
		let hiddenChanged = false;
		const applyHidden = (list: TableColumnNode[]) => {
			for (const column of list) {
				if (hiddenById.has(column.states.id)) {
					const v1 = hiddenById.get(column.states.id)!;
					if (!!column.states.hidden !== v1) {
						column.states.hidden = v1;
						hiddenChanged = true;
					}
				}
				if (column.childNodes.length) applyHidden(column.childNodes);
			}
		};
		applyHidden(_columns);

		// 2) 重排顶层 _columns（多级表头下外部多为 leaf id，匹配不到顶层则跳过）
		const templateOrder = sortByDom(_columns, this.store.table.exposed?.hiddenColumns?.value).map(column => column.states.id);
		const order = [...new Set(v.map(e => e?.id).filter(id => templateOrder.includes(id)))];
		this._sync.order = order.length && !isEqual(order, templateOrder.filter(id => order.includes(id)))
			? order
			: null;

		const orderChanged = this.sort();

		if (orderChanged || hiddenChanged) {
			this.store.updateColumns();
			this.store.scheduleLayout();
		}
	}
}
