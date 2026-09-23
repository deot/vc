import { computed, toRaw } from 'vue';
import { debounce } from 'lodash-es';
import { hasOwn } from '@deot/helper-utils';
import { getValuesMap, getRowValue } from '../../utils';
import { toggleRowStatus } from '../utils';
import type { Store } from '../store';

export class Selection {
	store: Store;

	// 行（raw）-> 在可选择行（flatData）中的下标，见 getIndex
	indexMap = computed(() => {
		const map = new Map<unknown, number>();
		this.store.flatData.value.forEach((row: any, index: number) => map.set(toRaw(row), index));
		return map;
	});

	constructor(store: Store) {
		this.store = store;
	}

	/**
	 * 行在可选择行（flatData）中的下标，即 selectable 的第二个参数：
	 * 与展开状态无关，表头全选与行内勾选框取值一致；非树形表格即 data 中的下标
	 * @param row 行数据
	 * @returns 下标，不可选择的行（如 expandSelectable 为 false 时的子行）为 -1
	 */
	getIndex(row: any) {
		return this.indexMap.value.get(toRaw(row)) ?? -1;
	}

	isSelected(row: any) {
		const { selection = [] } = this.store.states;
		return selection.includes(row);
	}

	clear() {
		this.store.states.isAllSelected = false;
		const oldSelection = this.store.states.selection;

		if (this.store.states.selection.length) {
			this.store.states.selection = [];
		}
		if (oldSelection.length > 0) {
			this.store.table.emit('selection-change', []);
		}
	}

	clean() {
		const { primaryKey } = this.store.table.props;
		const { selection = [] } = this.store.states;
		let deleted: any;
		if (primaryKey) {
			deleted = [];
			const selectedMap = getValuesMap(selection, primaryKey);
			// 含树形子行，避免把仍存在的已选子行当作已删除
			const dataMap = getValuesMap(this.store.flatData.value, primaryKey);
			for (const key in selectedMap) {
				if (hasOwn(selectedMap, key) && !dataMap[key]) {
					deleted.push(selectedMap[key].row);
				}
			}
		} else {
			deleted = selection.filter((item: any) => {
				return !this.store.flatData.value.includes(item);
			});
		}

		if (deleted.length) {
			const newSelection = selection.filter((item: any) => !deleted.includes(item));
			this.store.states.selection = newSelection;
			this.store.table.emit('selection-change', newSelection.slice());
		}
	}

	toggle(row: any, selected?: any, emitChange = true) {
		const { selection } = this.store.states;
		const changed = toggleRowStatus(selection, row, selected);

		if (changed) {
			const newSelection = (this.store.states.selection || []).slice();
			// 调用 API 修改选中值，不触发 select 事件
			if (emitChange) {
				this.store.table.emit('select', newSelection, row);
			}
			this.store.table.emit('selection-change', newSelection);
		}
	}

	/**
	 * 批量选中（程序触发，不 emit select），变化时 emit 一次 selection-change
	 * @param rows 待选中的行
	 */
	add(rows: any[]) {
		const { selection } = this.store.states;
		const added = rows.filter(row => !selection.includes(row));
		if (!added.length) return;
		this.store.states.selection = [...selection, ...added];
		this.store.table.emit('selection-change', this.store.states.selection.slice());
	}

	toggleAll = debounce(() => {
		const { indeterminate } = this.store.table.props;
		const { selection, isAllSelected, selectable } = this.store.states;

		// 当只选择某些行(但不是全部)时，根据 indeterminate 的值选择或取消选择所有行
		const value = indeterminate
			? !isAllSelected
			: !(isAllSelected || selection.length);

		this.store.states.isAllSelected = value;

		let selectionChanged = false;
		this.store.flatData.value.forEach((row: any, index: number) => {
			if (selectable) {
				if (selectable.call(null, row, index) && toggleRowStatus(selection, row, value, true)) {
					selectionChanged = true;
				}
			} else if (toggleRowStatus(selection, row, value, true)) {
				selectionChanged = true;
			}
		});

		this.store.states.selection = [...selection].filter(i => typeof i !== 'undefined');
		const selection$ = this.store.states.selection.slice();
		if (selectionChanged) {
			this.store.table.emit('selection-change', selection$);
		}
		this.store.table.emit('select-all', selection$);
	}, 10);

	updateByRowKey() {
		const { primaryKey } = this.store.table.props;
		const { selection } = this.store.states;
		const selectedMap = getValuesMap(selection, primaryKey);
		// TODO：这里的代码可以优化
		this.store.states.selection = this.store.flatData.value.reduce((prev: any[], row: any) => {
			const rowId = getRowValue(row, primaryKey);
			const rowInfo = selectedMap[rowId];
			if (rowInfo) {
				prev.push(row);
			}
			return prev;
		}, []);
	}

	updateAllSelected() {
		const { selectable, data = [] } = this.store.states;

		if (data.length === 0) {
			this.store.states.isAllSelected = false;
			return;
		}

		let isAllSelected = true;
		let selectedCount = 0;

		const temp = this.store.flatData.value;
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
		this.store.states.isAllSelected = isAllSelected;
	}

	rowChanged(row: any) {
		this.toggle(row);
		this.updateAllSelected();
	}
}
