import { getRowIdentity } from '../utils';
import type { Store } from './store';

export class Current {
	store: Store;

	constructor(store: Store) {
		this.store = store;
	}

	reset(id: number | string) {
		const store = this.store;
		const { rowKey } = store.table.props;
		store.checkRowKey();

		const { data = [] } = store.states;
		const currentRow = data.find(item => getRowIdentity(item, rowKey) === id);
		store.states.currentRow = currentRow || null;
	}

	update() {
		const store = this.store;
		const { rowKey } = store.table.props;
		const { data = [], currentRow } = store.states;
		const oldCurrentRow = currentRow;

		// 当 currentRow 不在 data 中时尝试更新数据
		if (oldCurrentRow && !data.includes(oldCurrentRow)) {
			let newCurrentRow = null;
			if (rowKey) {
				newCurrentRow = data.find((item: any) => {
					return getRowIdentity(item, rowKey) === getRowIdentity(oldCurrentRow, rowKey);
				});
			}
			store.states.currentRow = newCurrentRow;
			if (newCurrentRow !== oldCurrentRow) {
				store.table.emit('current-change', null, oldCurrentRow);
			}
		}
	}
}
