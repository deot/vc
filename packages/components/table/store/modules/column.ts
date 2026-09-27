import { concat, isEqual, pick } from 'lodash-es';
import type { Nullable } from '@deot/helper-shared';
import type { TableColumnNode } from '../../table-column/table-column-node';
import { flattenColumnNodes, getAllColumnNodes } from '../utils';
import type { Store } from '../store';
import type { TableColumnMove } from './drag';

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

	const allColumns = getAllColumnNodes(v);

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
 * 列在外部顺序中的排位：自身 id 有排位时取之，否则取子孙中最靠前的排位（外部顺序多为叶子 id）
 * @param column 列节点
 * @param rank 列 id -> 排位
 * @returns 排位；自身与子孙都不在外部顺序中时为 undefined
 */
const getRank = (column: TableColumnNode, rank: Map<string, number>): number | undefined => {
	const own = rank.get(column.states.id);
	if (own != null) return own;
	let min: number | undefined;
	for (const child of column.childNodes) {
		const value = getRank(child, rank);
		if (value != null && (min == null || value < min)) min = value;
	}
	return min;
};

/**
 * 在模板顺序之上叠加外部顺序：有排位的列按排位，新列跟在其模板中的前一列之后（无前一列时放最前）。
 * @param columns 按模板顺序排列的同一层列节点
 * @param order 外部顺序（列 id）
 * @returns 排序后的新数组
 */
const applyOrder = (columns: TableColumnNode[], order: string[]) => {
	const rank = new Map(order.map((id, index) => [id, index]));
	const ranks = new Map(columns.map(column => [column, getRank(column, rank)]));
	const result = columns
		.filter(column => ranks.get(column) != null)
		.sort((a, b) => ranks.get(a)! - ranks.get(b)!);
	columns.forEach((column, index) => {
		if (ranks.get(column) != null) return;
		const prev = columns[index - 1];
		result.splice(prev ? result.indexOf(prev) + 1 : 0, 0, column);
	});
	return result;
};

export class Column {
	store: Store;

	_sync = {
		snapshot: [] as TableColumnSyncItem[],
		// 外部写回（v-model:columns）或列拖拽得到的列 id 顺序（多为叶子 id），逐层叠加在模板顺序之上；
		// 与模板顺序一致时为 null，即跟随模板
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
		this.getSiblings(parent).push(column);

		if (this.store.table.exposed.isReady.value) {
			this.sort(parent);
			this.store.updateColumns();
			this.store.scheduleLayout();
		}
	}

	remove(column: TableColumnNode, parent?: TableColumnNode) {
		const array = this.getSiblings(parent);
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
	 * 一层列（兄弟列）：分组的子列，顶层为 _columns
	 * @param parent 父列节点，省略或 null 时为顶层
	 * @returns 兄弟列数组
	 */
	getSiblings(parent?: Nullable<TableColumnNode>) {
		return parent ? parent.childNodes : this.store.states._columns;
	}

	/**
	 * 按模板（DOM）顺序整理一层列，再叠加列顺序（不修改列节点）
	 * @param parent 父列节点，省略时为顶层
	 * @param order 列 id 顺序；省略时只按模板顺序
	 * @returns 整理后的新数组（已有序时为原数组）
	 */
	arrange(parent?: Nullable<TableColumnNode>, order?: Nullable<string[]>) {
		// 模板容器：顶层为隐藏的列容器，分组内为分组列的根元素
		const container = parent
			? parent.instance?.vnode.el as Nullable<Element>
			: this.store.table.exposed?.hiddenColumns?.value;
		const sorted = sortByDom(this.getSiblings(parent), container);
		return order ? applyOrder(sorted, order) : sorted;
	}

	/**
	 * 按给定顺序整理后的叶子 id 序列（不修改列节点）；省略顺序时即模板顺序
	 * @param order 列 id 顺序
	 * @returns 叶子 id 序列
	 */
	getLeafOrder(order?: Nullable<string[]>) {
		const walk = (parent?: TableColumnNode): string[] => {
			return this.arrange(parent, order).flatMap(column => (column.childNodes.length ? walk(column) : [column.states.id]));
		};
		return walk();
	}

	/**
	 * 记录列顺序：与模板顺序一致时记为 null（跟随模板）
	 * @param order 列 id 顺序
	 */
	setOrder(order: Nullable<string[]>) {
		this._sync.order = order && order.length && !isEqual(this.getLeafOrder(order), this.getLeafOrder())
			? order
			: null;
	}

	/**
	 * 按模板（DOM）顺序整理一层列；存在外部顺序时再叠加外部顺序（每一层都按排位重排）。
	 * @param parent 父列节点，省略时为顶层
	 * @returns 顺序是否变化
	 */
	sort(parent?: TableColumnNode) {
		const array = this.getSiblings(parent);
		const sorted = this.arrange(parent, this._sync.order);
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
			this.getSiblings(parent).forEach((column) => {
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
		const isLeftFixed = (column: TableColumnNode) => column.states.fixed === true || column.states.fixed === 'left';

		// 基于可见树（剔除 hidden）派生 fixed 分组与 headerRows；leaf 为原引用，可直接与 autoFixed 比较
		const visibleColumns = this.cloneVisibleTree(_columns);

		// 最前的 selection 列在存在（可见的）左固定列时随之左固定：只影响分组，不改写列自身的 fixed，
		// 其余列取消固定或被隐藏后随之恢复
		const first = visibleColumns[0];
		const autoFixed = first && first.states.type === 'selection' && !first.states.fixed && visibleColumns.some(isLeftFixed)
			? first
			: null;

		const leftFixedColumns = visibleColumns.filter(column => isLeftFixed(column) || column === autoFixed);
		const rightFixedColumns = visibleColumns.filter(column => column.states.fixed === 'right');
		const notFixedColumns = visibleColumns.filter(column => !column.states.fixed && column !== autoFixed);
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
	 * 拖拽排序：把列（分组连同子列）移到同一父级中的新位置，以移动后的叶子顺序作为列顺序，并经 update:columns 发出
	 * @param move 列的移动
	 * @returns 新的扁平列表（与 update:columns 相同）
	 */
	move(move: TableColumnMove) {
		const { from, to } = move;
		const siblings = this.getSiblings(from.parent);
		siblings.splice(to.index, 0, ...siblings.splice(from.index, 1));
		this.setOrder(flattenColumnNodes(this.store.states._columns).map(column => column.states.id));
		this.store.updateColumns();
		this.store.scheduleLayout();
		return this._sync.snapshot;
	}

	/**
	 * 向外部 emit update:columns。
	 * 暴露全部收集到的 leaf 列（含被隐藏的，带 hidden 标记），不做可见性过滤。
	 */
	syncToParent() {
		const columns = this.getSyncItems();
		if (isEqual(columns, this._sync.snapshot)) return;
		this._sync.snapshot = columns;
		this.store.table.emit('update:columns', columns);
	}

	/**
	 * 当前的扁平列表（update:columns 发出的内容）：全部 leaf 列，含被隐藏的
	 * @returns 同步项
	 */
	getSyncItems() {
		return flattenColumnNodes(this.store.states._columns).map(column => pick(column.states, COLUMN_SYNC_KEYS) as TableColumnSyncItem);
	}

	/**
	 * 处理外部对 v-model:columns 的写回：
	 * 	1) 按 id 把 hidden 回写到内部列节点（递归含 childNodes，覆盖多级表头）；
	 * 	2) 按 id 记录顺序并逐层重排：分组按其叶子中最靠前的排位；与模板顺序一致时不记录（跟随模板），
	 * 	   否则外部顺序优先，缺失项（如新增列）跟在其模板中的前一列之后。
	 * @param v 外部写回的列数组
	 */
	applyExternal(v: TableColumnSyncItem[]) {
		const _columns = this.store.states._columns;
		// 与当前列一致（包括 update:columns 写回的回流）：无需处理。
		// 按内容而不是标记识别回流：发出后不写回（只监听 update:columns）时，之后的外部修改照常生效
		if (!Array.isArray(v) || !v.length || isEqual(v, this.getSyncItems())) return;

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

		// 2) 逐层重排（外部多为叶子 id，也可以是分组 id）
		const ids = new Set(getAllColumnNodes(_columns).map(column => column.states.id));
		this.setOrder([...new Set(v.map(e => e?.id).filter(id => ids.has(id)))]);

		const orderChanged = this.sortTree();

		if (orderChanged || hiddenChanged) {
			this.store.updateColumns();
			this.store.scheduleLayout();
		}
	}
}
