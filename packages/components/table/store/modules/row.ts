import { getRowValue } from '../../utils';
import type { Store } from '../store';

export class Row {
	store: Store;

	constructor(store: Store) {
		this.store = store;
	}

	setHoverIndex(index: any) {
		this.store.states.hoverRowIndex = index;
	}

	// 设置 currentRow；传 null 取消高亮，变化时 emit current-change
	set(row: any) {
		const old = this.store.states.currentRow;
		this.store.states.currentRow = row;
		if (old !== row) {
			this.store.table.emit('current-change', row, old);
		}
	}

	// v-model currentRowValue 按 primaryKey 同步，不 emit；树形表格含子行
	setById(id?: number | string) {
		const store = this.store;
		const { primaryKey } = store.table.props;
		const currentRow = store.tree.rows.find((item: any) => getRowValue(item, primaryKey) === id);
		store.states.currentRow = currentRow || null;
	}

	update() {
		const store = this.store;
		const { primaryKey } = store.table.props;
		const oldCurrentRow = store.states.currentRow;
		// 树形表格含子行
		const rows = store.tree.rows;

		// 当 currentRow 不在数据中时，按 primaryKey 找回新数据中的同一行
		if (oldCurrentRow && !rows.includes(oldCurrentRow)) {
			const id = primaryKey ? getRowValue(oldCurrentRow, primaryKey) : void 0;
			const newCurrentRow = (primaryKey && rows.find((item: any) => getRowValue(item, primaryKey) === id)) || null;
			store.states.currentRow = newCurrentRow;
			store.table.emit('current-change', newCurrentRow, oldCurrentRow);
		}
	}
}
