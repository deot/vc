import { computed, reactive, toRaw } from 'vue';
import type { Nullable } from '@deot/helper-shared';
import { bisectLast } from '../../../recycle-list/store/position';
import { flattenColumnNodes } from '../utils';
import type { Store } from '../store';
import type { TableColumnNode } from '../../table-column/table-column-node';
import type { TableBlockDragPayload, TableColumnDragPayload, TableColumnDropPayload } from '../../types';

// 两个数组的行（raw）逐项相同
const isSameRows = (a: any[], b: any[]) => {
	return a.length === b.length && a.every((row, i) => toRaw(row) === toRaw(b[i]));
};

/**
 * 落点位置：相对落点行之前 / 之后，或成为它的子行（仅树形表格）
 */
export type TableDropPosition = 'before' | 'after' | 'inner';

/**
 * 行在兄弟数组中的位置：parent 为 null 表示根级（非树形表格即 data 中的下标）
 */
export type TableDropPlace = {
	parent: any;
	index: number;
};

/**
 * 块的移动：从 from 移到 to，to.index 为移除被拖行之后的下标。
 * 非树形表格为 data 中块首行的下标（块的全部行一起移动）；树形表格为兄弟数组中的下标（被拖行连同子孙一起移动）
 */
export type TableMove = {
	from: TableDropPlace;
	to: TableDropPlace;
};

/**
 * 列拖拽的落点位置：相对落点列之前 / 之后
 */
export type TableColumnDropPosition = Exclude<TableDropPosition, 'inner'>;

/**
 * 列的位置：parent 为父分组，顶层为 null；index 为兄弟列（含隐藏列）中的下标
 */
export type TableColumnPlace = {
	parent: Nullable<TableColumnNode>;
	index: number;
};

/**
 * 列的移动：同一父级内从 from 移到 to，to.index 为移除被拖列之后的下标（分组连同子列一起移动）
 */
export type TableColumnMove = {
	from: TableColumnPlace;
	to: TableColumnPlace;
};

// 参与列拖拽的普通列：selection / index / expand / drag 等结构列不能拖动，也不作为落点
const isPlainColumn = (column: TableColumnNode) => column.states.type === 'default';

/**
 * 拖拽排序（以块为单位）：
 * 	- 块即渲染 / 虚拟化的最小单位（见 Block），普通表格一行一块，getSpan 纵向合并的若干行为一块；
 * 	- 非树形表格的块对应 data 中连续的一段行，移动块即移动这段行；
 * 	  data 由外部持有（v-model:data），这里只计算新顺序，并记录最近一次发出的顺序，
 * 	  外部写回时 setData 据此识别为重排，保留选中等状态；
 * 	- 树形表格每行一块，被拖行连同子孙移到新的父行下（before / after / inner）；
 * 	- 列拖拽（draggable 第二项）：拖动表头在同一父级内调整列顺序，新顺序由 Column#move 在表格内部生效并经 update:columns 发出。
 */
export class Drag {
	store: Store;

	// 最近一次发出（update:data）的顺序，元素为 raw 行；写回命中后清除，未命中时保留到下一次发出
	pending: any[] | null = null;

	/**
	 * 规整后的 draggable：[整行拖拽, 列拖拽]，true 只开启整行拖拽
	 */
	draggable = computed<[boolean, boolean]>(() => {
		const value = this.store.table.props.draggable;
		return Array.isArray(value) ? [!!value[0], !!value[1]] : [!!value, false];
	});

	/**
	 * 整行显示 move 光标（并禁用触摸长按的系统菜单）：开启了整行拖拽，且没有把手列（有把手时由把手提示）
	 */
	rowCursor = computed(() => {
		const { store } = this;
		return this.draggable.value[0]
			&& !this.disabled
			&& !store.states.columns.some(column => column.states.type === 'drag');
	});

	constructor(store: Store) {
		this.store = store;
	}

	/**
	 * 块的行数据（与 row-click 等事件一致，取自渲染块）
	 * @param block states.list 中的块
	 * @returns 行数据
	 */
	getRows(block: any): any[] {
		return block.rows.map((row: any) => row.data);
	}

	/**
	 * 块的行与首行行号：allowDrag、block-dragstart / block-dragend 的参数
	 * @param block states.list 中的块
	 * @returns 行与首行行号
	 */
	getPayload(block: any): TableBlockDragPayload {
		return { rows: this.getRows(block), rowIndex: block.rowStart };
	}

	/**
	 * 按行号查找所属的块（states.list 按 rowStart 递增）
	 *
	 * 查找本身不建立响应式依赖：把手在渲染中调用，list 在每次 setData 时整体替换，不应让所有块随之重渲染；
	 * 找到的块经响应式代理返回，之后读取它的行仍按块追踪
	 * @param rowIndex 行号
	 * @returns 块；不存在时为 null
	 */
	getBlockByRowIndex(rowIndex: number) {
		const { list } = toRaw(this.store.states);
		const block = list[bisectLast(list.length, i => list[i].rowStart <= rowIndex)];
		return block && rowIndex < block.rowStart + block.rows.length ? reactive(block) : null;
	}

	/**
	 * 整张表格不可拖拽：树形表格同时配置了 getSpan（合并块在树中的语义不明确）
	 * @returns 是否不可拖拽
	 */
	get disabled() {
		return this.store.tree.isTree && typeof this.store.table.props.getSpan === 'function';
	}

	/**
	 * 块能否被拖动：交给 allowDrag
	 * @param block 块
	 * @returns 能否拖动
	 */
	canDrag(block: any) {
		if (this.disabled) return false;
		const { allowDrag } = this.store.table.props;
		return typeof allowDrag !== 'function' || !!allowDrag({ type: 'block', ...this.getPayload(block) });
	}

	/**
	 * 能否放到落点：交给 allowDrop
	 * @param block 拖动的块
	 * @param targetRows 落点行
	 * @param position 相对落点行的位置
	 * @param move 移动
	 * @returns 能否放置
	 */
	canDrop(block: any, targetRows: any[], position: TableDropPosition, move: TableMove) {
		const { allowDrop } = this.store.table.props;
		return typeof allowDrop !== 'function' || !!allowDrop({
			type: 'block',
			rows: this.getRows(block),
			targetRows,
			position,
			...move
		});
	}

	/**
	 * 行在兄弟数组中的下标；逐项比较 raw 行：数组中存放的可能是响应式代理（如由响应式状态派生的数组）
	 * @param parent 父行；根行为 null
	 * @param row 行数据
	 * @returns 下标；不在其中时为 -1
	 */
	indexOf(parent: any, row: any) {
		const target = toRaw(row);
		return toRaw(this.store.tree.getSiblings(parent)).findIndex(item => toRaw(item) === target);
	}

	/**
	 * 行能否作为 inner 落点：
	 * 	- 没有主键值的行不能（树形结构按主键值展开，它的子行不会显示）；
	 * 	- 尚未加载的懒加载节点不能（子行未知，加载后会与放入的行冲突）
	 * @param row 行数据
	 * @returns 能否放入子行
	 */
	canInner(row: any) {
		const { tree } = this.store;
		const id = tree.getKey(row);
		return id != null && !tree.nodes[id]?.loadable;
	}

	/**
	 * 计算树形表格的移动
	 * @param block 拖动的块（树形表格为单行块）
	 * @param parent 新的父行；根级为 null
	 * @param index 插入位置（移除被拖行之前兄弟数组中的下标）
	 * @returns 移动；不能放进自身或子孙、位置不变时为 null
	 */
	getTreeMove(block: any, parent: any, index: number): TableMove | null {
		const { tree } = this.store;
		const row = block.rows[0].data;
		if (parent && (toRaw(parent) === toRaw(row) || tree.contains(row, parent))) return null;

		const fromParent = tree.getParent(row);
		const from = { parent: fromParent, index: this.indexOf(fromParent, row) };
		if (from.index < 0) return null;
		const same = toRaw(fromParent) === toRaw(parent);
		const to = same && index > from.index ? index - 1 : index;
		return same && to === from.index ? null : { from, to: { parent, index: to } };
	}

	/**
	 * 计算块的移动（非树形表格）
	 * @param block 拖动的块
	 * @param target 落点块
	 * @param position 相对落点块的位置
	 * @returns 移动；顺序不变时为 null
	 */
	getMove(block: any, target: any, position: TableDropPosition): TableMove | null {
		const from = block.rowStart;
		let to = position === 'before' ? target.rowStart : target.rowStart + target.rows.length;
		if (to > from) to -= block.rows.length;
		return to === from ? null : { from: { parent: null, index: from }, to: { parent: null, index: to } };
	}

	/**
	 * 执行移动，返回新的 data（元素为 raw 行，即外部数组中存放的行），并记录为待写回的数组：
	 * 	- 非树形表格不修改传入的数组，新数组中块的全部行移到新位置；
	 * 	- 树形表格原地移动（与 Tree 组件一致）：被拖行连同子孙从原兄弟数组移到新父行的子行中，
	 * 	  兄弟数组为根级 data、父行的 children 或懒加载得到的子行，均经响应式代理修改，表格随之更新；
	 * 	  新父行没有子行时为它新建 children，并展开新父行，让移入的行可见；返回根数组的副本；
	 * 	  lazy-tree 下原父行由数据提供的子行被移空时，清除它的 hasChildren，否则会被当作尚未加载的懒加载节点（展开时重新加载）
	 * @param block 拖动的块
	 * @param move 移动
	 * @returns 新的 data
	 */
	apply(block: any, move: TableMove) {
		const { tree, states } = this.store;
		const { from, to } = move;
		let next: any[];
		if (tree.isTree) {
			const { childrenKey, hasChildrenKey } = tree.fields;
			const siblings = tree.getSiblings(from.parent);
			const [row] = siblings.splice(from.index, 1);
			const { parent } = from;
			// lazy-tree 下原父行由数据提供的子行被移空：清除 hasChildren，成为叶子行
			if (
				parent && !siblings.length && this.store.table.props.lazyTree
				&& parent[hasChildrenKey] && !states.treeLazyChildren[tree.getKey(parent)]
			) {
				parent[hasChildrenKey] = false;
			}
			// 新父行还没有子行（叶子行）：为它新建 children
			if (to.parent && !states.treeLazyChildren[tree.getKey(to.parent)] && !Array.isArray(to.parent[childrenKey])) {
				to.parent[childrenKey] = [];
			}
			tree.getSiblings(to.parent).splice(to.index, 0, row);
			to.parent && (states.treeExpanded[tree.getKey(to.parent)] = true);
			next = toRaw(states.data).slice();
		} else {
			next = toRaw(states.data).slice();
			next.splice(to.index, 0, ...next.splice(from.index, block.rows.length));
		}
		this.pending = next;
		return next;
	}

	/**
	 * 外部写回的 data 是否为最近一次发出的数组：
	 * 	- 写回的正是发出的数组；
	 * 	- 或是它的副本（逐项比较 raw 行），且当前 data 还不是这个顺序。
	 * 	  当前 data 已是这个顺序时（树形表格已原地修改，或外部已在原数组上调整），副本与普通的浅拷贝无法区分，按新数据处理
	 * @param data 新的 data
	 * @returns 是否为拖拽后的重排
	 */
	consume(data: any[]) {
		const { pending } = this;
		if (!pending) return false;
		const source = toRaw(data);
		const hit = source === pending
			|| (!isSameRows(toRaw(this.store.states.data), pending) && isSameRows(source, pending));
		hit && (this.pending = null);
		return hit;
	}

	// ---------------------------------------------------------------------
	// 列拖拽（拖动表头调整列顺序，同一父级内移动，分组连同子列一起移动）
	// ---------------------------------------------------------------------
	/**
	 * 列（分组时为它的第一个可见叶子）在可见叶子列中的下标，与 cell 事件的 columnIndex 一致
	 * @param column 列节点
	 * @returns 下标；列不可见时为 -1
	 */
	getColumnIndex(column: TableColumnNode) {
		const leaves = flattenColumnNodes([column]);
		return this.store.states.columns.findIndex(item => leaves.includes(item));
	}

	/**
	 * 列所在的固定分组：按顶层祖先所在的分组（左固定含随之固定的首个 selection 列；分组在其中为克隆节点）
	 * @param column 列节点
	 * @returns left / right；不固定时为空字符串
	 */
	getColumnSide(column: TableColumnNode) {
		let top = column;
		while (top.parentNode) top = top.parentNode;
		const isTop = (item: TableColumnNode) => (item.origin ?? item) === top;
		const { leftFixedColumns, rightFixedColumns } = this.store.states;
		if (leftFixedColumns.some(isTop)) return 'left';
		if (rightFixedColumns.some(isTop)) return 'right';
		return '';
	}

	/**
	 * 列与它的下标：allowDrag、column-dragstart / column-dragend 的参数
	 * @param column 列节点
	 * @returns 列（states）与下标
	 */
	getColumnPayload(column: TableColumnNode): TableColumnDragPayload {
		return { column: column.states, columnIndex: this.getColumnIndex(column) };
	}

	/**
	 * 列能否被拖动：开启了列拖拽的可见普通列，再交给 allowDrag
	 * @param column 列节点
	 * @returns 能否拖动
	 */
	canDragColumn(column: TableColumnNode) {
		if (!this.draggable.value[1] || !isPlainColumn(column)) return false;
		const columnIndex = this.getColumnIndex(column);
		if (columnIndex < 0) return false;
		const { allowDrag } = this.store.table.props;
		return typeof allowDrag !== 'function' || !!allowDrag({ type: 'column', column: column.states, columnIndex });
	}

	/**
	 * 能否作为列的落点：同一父级、同一固定分组内的另一个可见普通列
	 * @param column 拖动的列
	 * @param target 落点列
	 * @returns 能否作为落点
	 */
	isColumnTarget(column: TableColumnNode, target: TableColumnNode) {
		return column !== target
			&& isPlainColumn(target)
			&& column.parentNode === target.parentNode
			&& this.getColumnIndex(target) >= 0
			&& (!!column.parentNode || this.getColumnSide(column) === this.getColumnSide(target));
	}

	/**
	 * 计算列的移动
	 * @param column 拖动的列
	 * @param target 落点列
	 * @param position 相对落点列的位置
	 * @returns 移动；不能作为落点或顺序不变时为 null
	 */
	getColumnMove(column: TableColumnNode, target: TableColumnNode, position: TableColumnDropPosition): Nullable<TableColumnMove> {
		if (!this.isColumnTarget(column, target)) return null;
		const parent = column.parentNode;
		const siblings = this.store.column.getSiblings(parent);
		const from = siblings.indexOf(column);
		let to = siblings.indexOf(target) + (position === 'after' ? 1 : 0);
		if (to > from) to--;
		return to === from ? null : { from: { parent, index: from }, to: { parent, index: to } };
	}

	/**
	 * allowDrop（type 为 column）与 column-drop 共有的参数：from / to 的 parent 为父分组的 states
	 * @param column 拖动的列
	 * @param target 落点列
	 * @param position 相对落点列的位置
	 * @param move 移动
	 * @returns 参数
	 */
	getColumnDropPayload(
		column: TableColumnNode,
		target: TableColumnNode,
		position: TableColumnDropPosition,
		move: TableColumnMove
	): Omit<TableColumnDropPayload, 'columns'> {
		const toPlace = ({ parent, index }: TableColumnPlace) => ({ parent: parent ? parent.states : null, index });
		return { column: column.states, targetColumn: target.states, position, from: toPlace(move.from), to: toPlace(move.to) };
	}

	/**
	 * 能否把列放到落点：交给 allowDrop
	 * @param column 拖动的列
	 * @param target 落点列
	 * @param position 相对落点列的位置
	 * @param move 移动
	 * @returns 能否放置
	 */
	canDropColumn(column: TableColumnNode, target: TableColumnNode, position: TableColumnDropPosition, move: TableColumnMove) {
		const { allowDrop } = this.store.table.props;
		return typeof allowDrop !== 'function' || !!allowDrop({ type: 'column', ...this.getColumnDropPayload(column, target, position, move) });
	}
}
