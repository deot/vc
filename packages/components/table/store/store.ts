import { nextTick, computed } from 'vue';
import { merge, debounce, concat } from 'lodash';
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
			const cache = caches.get(row) || { heightMap: {} };
			const rows = [
				{
					index,
					data: row,
					height: cache.height || '',
					heightMap: {
						left: cache.heightMap.left || '',
						main: cache.heightMap.main || '',
						right: cache.heightMap.right || ''
					}
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
		const leftFixedColumns = _columns.filter(column => column.fixed === true || column.fixed === 'left');
		const rightFixedColumns = _columns.filter(column => column.fixed === 'right');

		if (leftFixedColumns.length > 0 && _columns[0] && _columns[0].type === 'selection' && !_columns[0].fixed) {
			_columns[0].fixed = true;
			leftFixedColumns.unshift(_columns[0]);
		}

		const notFixedColumns = _columns.filter(column => !column.fixed);
		const originColumns = concat(leftFixedColumns, notFixedColumns, rightFixedColumns);
		const headerRows = columnsToRowsEffect(originColumns);

		// set
		states.leftFixedColumns = leftFixedColumns;
		states.notFixedColumns = notFixedColumns;
		states.rightFixedColumns = rightFixedColumns;
		states.originColumns = originColumns;
		states.headerRows = headerRows;
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
	 * @returns ~
	 */
	toggleRowStatus(statusArr: any, row: any, newVal: any) {
		let changed = false;
		const index = statusArr.indexOf(row);
		const included = index !== -1;

		const addRow = () => {
			statusArr.push(row);
			changed = true;
		};
		const removeRow = () => {
			statusArr.splice(index, 1);
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
				if (selectable.call(null, row, index) && this.toggleRowStatus(selection, row, value)) {
					selectionChanged = true;
				}
			} else if (this.toggleRowStatus(selection, row, value)) {
				selectionChanged = true;
			}
		});

		if (selectionChanged) {
			this.table.emit('selection-change', selection ? selection.slice() : []);
		}
		this.table.emit('select-all', selection);
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
