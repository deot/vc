import { getRowValue } from '../utils';
import type { Store } from './store';

export class Current {
	store: Store;

	constructor(store: Store) {
		this.store = store;
	}

	reset(id: number | string) {
		const store = this.store;
		const { primaryKey } = store.table.props;
		store.checkPrimaryKey();

		const { data = [] } = store.states;
		const currentRow = data.find(item => getRowValue(item, primaryKey) === id);
		store.states.currentRow = currentRow || null;
	}

	update() {
		const store = this.store;
		const { primaryKey } = store.table.props;
		const { data = [], currentRow } = store.states;
		const oldCurrentRow = currentRow;

		// 当 currentRow 不在 data 中时尝试更新数据
		if (oldCurrentRow && !data.includes(oldCurrentRow)) {
			let newCurrentRow = null;
			if (primaryKey) {
				newCurrentRow = data.find((item: any) => {
					return getRowValue(item, primaryKey) === getRowValue(oldCurrentRow, primaryKey);
				});
			}
			store.states.currentRow = newCurrentRow;
			if (newCurrentRow !== oldCurrentRow) {
				store.table.emit('current-change', null, oldCurrentRow);
			}
		}
	}
}
