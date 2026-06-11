import { nextTick, computed } from 'vue';
import { merge, debounce, concat, isEqualWith, pick } from 'lodash-es';
import { hasOwn } from '@deot/helper-utils';
import { getValuesMap, getRowValue } from '../utils';
import { VcError } from '../../vc';
import { BaseWatcher } from './base-watcher';
import { Expand } from './expand-mixin';
import { Current } from './current-mixin';
import { Tree } from './tree-mixin';
import { Layout } from './layout';
import { columnsToRowsEffect, flattenData } from './utils';

class Store extends BaseWatcher {
	table: any;
	current: Current;
	expand: Expand;
	tree: Tree;
	layout: Layout;

	// v-model:columns 同步状态：columns 去重 emit；suppressWatch 防回环
	_columnsSync = {
		snapshot: [] as any[],
		suppressWatch: false
	};

	flatData = computed(() => {
		if (this.table.props.expandSelectable) {
			return concat(
				flattenData(this.states.data, { parent: true, cascader: true }),
				this.states.treeLazyData
			);
		} else {
			return this.states.data;
		}
	});

	constructor(options: any) {
		super();

		if (!options.table) {
			throw new VcError('table', 'table必传');
		}
		this.table = options.table;

		this.current = new Current(this);
		this.expand = new Expand(this);
		this.tree = new Tree(this);
		this.layout = new Layout(this);

		const { props } = options.table;
		merge(this.states, {
			expandSelectable: props.expandSelectable,
			treeLazy: props.lazy || false,
			treeLazyColumnIdentifier: props.treeMap.hasChildren || 'hasChildren',
			treeChildrenColumnName: props.treeMap.children || 'children',
		});
	}

	setData(data: any[]) {
		const { primaryKey } = this.table.props;
		// 用户是否修改了数据
		const dataInstanceChanged = this.states._data !== data;

		// clone
		this.states._data = data;
		// reset
		this.states.data = data;

		// 获取历史row的高度，还原
		const caches = new Map();
		this.states.list.forEach((item) => {
			item.rows.forEach((row: any) => {
				caches.set(row.data, row);
			});
		});
		this.states.list = data.reduce((pre, row, index) => {
			const cache = caches.get(row) || { };
			const rows = [
				{
					index,
					data: row,
					height: cache.height || ''
				}
			];
			const id = primaryKey
				? rows.map((rowData: any) => getRowValue(rowData.data, primaryKey)).join(',')
				: index;
			pre.push({
				id: typeof id === 'undefined' ? index : id,
				rows,
				expand: false
			});
			return pre;
		}, []);
		caches.clear();

		/**
		 * 数据变化，更新部分数据。
		 * 没有使用 computed，而是手动更新部分数据
		 * https://github.com/vuejs/vue/issues/6660#issuecomment-331417140
		 */
		this.current.update();
		this.expand.update();
		if (!this.states.reserveSelection) {
			if (dataInstanceChanged) {
				this.clearSelection();
			} else {
				this.cleanSelection();
			}
		} else {
			this.checkPrimaryKey();
			this.updateSelectionByRowKey();
		}
		this.updateAllSelected();
		this.updateTableScrollY();
	}

	rowSelectedChanged(row: any) {
		this.toggleRowSelection(row);
		this.updateAllSelected();
	}

	// TODO: 合并的多行管理
	setHoverRow(index: any) {
		this.states.hoverRowIndex = index;
	}

	setCurrentRow(row: any) {
		const oldCurrentRow = this.states.currentRow;
		this.states.currentRow = row;

		if (oldCurrentRow !== row) {
			// @ts-ignore
			this.table.emit('current-change', row, oldCurrentRow);
		}
	}

	/**
	 * 检查 primaryKey 是否存在
	 */
	checkPrimaryKey() {
		const { primaryKey } = this.table.props;
		if (!primaryKey) {
			// throw new VcError('vc-table', 'primary-key 必传');
		}
	}

	/**
	 * states
	 * 	-> _columns
	 * 	-> selectable
	 * 	-> reserveSelection
	 * @param column ~
	 * @param index ~
	 * @param parent ~
	 */
	insertColumn(column: any, index: any, parent: any) {
		let array = this.states._columns;

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
			this.states.selectable = column.selectable;
			this.states.reserveSelection = column.reserveSelection;
		}

		if (this.table.exposed.isReady.value) {
			this.updateColumns();
			this.scheduleLayout();
		}
	}

	removeColumn(column: any, parent: any) {
		let array = this.states._columns;
		if (parent) {
			array = parent.children || [];
		}
		if (array) {
			array.splice(array.indexOf(column), 1);
		}

		if (this.table.exposed.isReady.value) {
			this.updateColumns();
			this.scheduleLayout();
		}
	}

	/**
	 * 更新列
	 * leftFixedColumns: 左fixed
	 * rightFixedColumns: 右fixed
	 * originColumns: 中（包括左右）
	 * columns: 展开以上
	 * leafColumnsLength
	 * leftFixedLeafColumnsLength
	 * rightFixedLeafColumnsLength
	 * isComplex: 是否包含固定列
	 */
	updateColumns() {
		const { states } = this;
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

		// set
		states.leftFixedColumns = leftFixedColumns;
		states.notFixedColumns = notFixedColumns;
		states.rightFixedColumns = rightFixedColumns;
		states.originColumns = originColumns;
		states.headerRows = headerRows;

		this.syncColumnsToParent();
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
	 * 指纹同时纳入 id 顺序与各列 hidden 状态：
	 * 	- 外部写回（顺序/hidden）后内部应用，指纹不变 -> 不重复 emit，避免回环；
	 * 	- 内部列增删导致变化 -> 指纹变化 -> emit 通知外部。
	 */
	syncColumnsToParent() {
		const keys = ['id', 'hidden', 'label', 'prop', 'type'];
		const flattenColumns = flattenData(this.states._columns);
		const columns = flattenColumns.map((column: any) => pick(column, keys)) as any[];
		if (isEqualWith(columns.map(i => pick(i, keys)), this._columnsSync.snapshot.map(i => pick(i, keys)))) return;
		this._columnsSync.snapshot = columns;
		// 置位：本次 emit 会回流为外部写回，applyExternalColumns 据此跳过，避免回环
		this._columnsSync.suppressWatch = true;
		this.table.emit('update:columns', columns);
	}

	/**
	 * 处理外部对 v-model:columns 的写回：
	 * 	1) 按 id 把 hidden 回写到内部列对象（递归含 children，覆盖多级表头）；
	 * 	2) 按 id 对齐顺序重排顶层 _columns（缺失项按原相对顺序补在末尾，避免误丢列）。
	 * @param v 外部写回的列数组
	 */
	applyExternalColumns(v: any[]) {
		if (this._columnsSync.suppressWatch) {
			this._columnsSync.suppressWatch = false;
			return;
		}
		const _columns = this.states._columns;
		if (!Array.isArray(v) || !v.length) return;

		// 1) 写 hidden（按 id，递归 children）
		const hiddenById = v.reduce((pre, e) => (e && e.id != null && pre.set(e.id, !!e.hidden), pre), new Map<string, boolean>());
		let hiddenChanged = false;
		const applyHidden = (list: any[]) => {
			for (const column of list) {
				if (hiddenById.has(column.id)) {
					const v1 = hiddenById.get(column.id)!;
					if (!!column.hidden !== v1) {
						column.hidden = v1; // 更新原对象
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
		orderChanged && (this.states._columns = reordered); // 更新原对象

		if (orderChanged || hiddenChanged) {
			this.updateColumns();
			this.scheduleLayout();
		}
	}

	// 选择
	isSelected(row: any) {
		const { selection = [] } = this.states;
		return selection.includes(row);
	}

	/**
	 * 清除选择
	 */
	clearSelection() {
		this.states.isAllSelected = false;
		const oldSelection = this.states.selection;

		if (this.states.selection.length) {
			this.states.selection = [];
		}
		if (oldSelection.length > 0) {
			this.table.emit('selection-change', []);
		}
	}

	/**
	 * 清理选择
	 */
	cleanSelection() {
		const { primaryKey } = this.table.props;
		const { selection = [], data } = this.states;
		let deleted: any;
		if (primaryKey) {
			deleted = [];
			const selectedMap = getValuesMap(selection, primaryKey);
			const dataMap = getValuesMap(data, primaryKey);
			for (const key in selectedMap) {
				if (hasOwn(selectedMap, key) && !dataMap[key]) {
					deleted.push(selectedMap[key].row);
				}
			}
		} else {
			deleted = selection.filter((item: any) => {
				return !this.flatData.value.includes(item);
			});
		}

		deleted.forEach((deletedItem: any) => {
			selection.splice(selection.indexOf(deletedItem), 1);
		});

		if (deleted.length) {
			const newSelection = selection.filter((item: any) => !deleted.includes(item));
			this.states.selection = newSelection;
			this.table.emit('selection-change', newSelection.slice());
		}
	}

	/**
	 * 存在副作用
	 * 对statusArr做添加和删除的操作
	 * 如 this.states.selection
	 * @param statusArr ~
	 * @param row ~
	 * @param newVal ~
	 * @param batch 为true时，使用delete (批处理使用splice性能差，使用delete后统一再处理)
	 * @returns ~
	 */
	toggleRowStatus(statusArr: any, row: any, newVal: any, batch = false) {
		let changed = false;
		const index = statusArr.indexOf(row);
		const included = index !== -1;

		const addRow = () => {
			statusArr.push(row);
			changed = true;
		};
		const removeRow = () => {
			if (!batch) {
				statusArr.splice(index, 1);
			} else {
				delete statusArr[index];
			}
			changed = true;
		};

		if (typeof newVal === 'boolean') {
			if (newVal && !included) {
				addRow();
			} else if (!newVal && included) {
				removeRow();
			}
		} else {
			included ? removeRow() : addRow();
		}
		return changed;
	}

	toggleRowSelection(row: any, selected?: any, emitChange = true) {
		const { selection } = this.states;
		const changed = this.toggleRowStatus(selection, row, selected);

		if (changed) {
			const newSelection = (this.states.selection || []).slice();
			// 调用 API 修改选中值，不触发 select 事件
			if (emitChange) {
				this.table.emit('select', newSelection, row);
			}
			this.table.emit('selection-change', newSelection);
		}
	}

	toggleAllSelection = debounce(() => {
		const { indeterminate } = this.table.props;
		const { selection, isAllSelected, selectable } = this.states;

		// 当只选择某些行(但不是全部)时，根据selectonindefined的值选择或取消选择所有行
		const value = indeterminate
			? !isAllSelected
			: !(isAllSelected || selection.length);

		this.states.isAllSelected = value;

		let selectionChanged = false;
		this.flatData.value.forEach((row: any, index: number) => {
			if (selectable) {
				if (selectable.call(null, row, index) && this.toggleRowStatus(selection, row, value, true)) {
					selectionChanged = true;
				}
			} else if (this.toggleRowStatus(selection, row, value, true)) {
				selectionChanged = true;
			}
		});

		this.states.selection = [...selection].filter(i => typeof i !== 'undefined');
		const selection$ = this.states.selection.slice();
		if (selectionChanged) {
			this.table.emit('selection-change', selection$);
		}
		this.table.emit('select-all', selection$);
	}, 10);

	// 展开行与 TreeTable 都要使用
	toggleRowExpansionAdapter(row: any, expanded?: boolean) {
		const { columns } = this.states;
		const hasExpandColumn = columns.some(({ type }) => type === 'expand');
		if (hasExpandColumn) {
			this.expand.toggle(row, expanded);
		} else {
			this.tree.toggle(row, expanded);
		}
	}

	// 适配层，expand-primary-keys 在 Expand 与 TreeTable 中都有使用
	// 这里会触发额外的计算，但为了兼容性，暂时这么做
	setExpandRowValueAdapter(val: any) {
		this.expand.reset(val);
		this.tree.expand(val);
	}

	updateSelectionByRowKey() {
		const { primaryKey } = this.table.props;
		const { selection } = this.states;
		const selectedMap = getValuesMap(selection, primaryKey);
		// TODO：这里的代码可以优化
		this.states.selection = this.flatData.value.reduce((prev: any[], row: any) => {
			const rowId = getRowValue(row, primaryKey);
			const rowInfo = selectedMap[rowId];
			if (rowInfo) {
				prev.push(row);
			}
			return prev;
		}, []);
	}

	updateAllSelected() {
		const { selectable, data = [] } = this.states;

		if (data.length === 0) {
			this.states.isAllSelected = false;
			return;
		}

		let isAllSelected = true;
		let selectedCount = 0;

		const temp = this.flatData.value;
		for (let i = 0, j = temp.length; i < j; i++) {
			const row = temp[i];
			const isRowSelectable = selectable && selectable.call(null, row, i);
			if (!this.isSelected(row)) {
				if (!selectable || isRowSelectable) {
					isAllSelected = false;
					break;
				}
			} else {
				selectedCount++;
			}
		}

		if (selectedCount === 0) isAllSelected = false;
		this.states.isAllSelected = isAllSelected;
	}

	updateTableScrollY() {
		nextTick(() => this.table.exposed.updateScrollY());
	}

	// 更新 DOM
	scheduleLayout(needUpdateColumns?: any) {
		if (needUpdateColumns) {
			this.updateColumns();
		}
		this.table.exposed.debouncedUpdateLayout();
	}
}

export { Store };
