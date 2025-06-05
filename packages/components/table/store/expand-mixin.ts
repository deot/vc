import { getKeysMap, getRowIdentity } from '../utils';
import type { Store } from './store';

export class Expand {
	store: Store;

	constructor(store: Store) {
		this.store = store;
	}

	update() {
		const store = this.store;
		const { rowKey, defaultExpandAll } = this.store.table.props;
		const { data = [], expandRows } = store.states;
		if (defaultExpandAll) {
			store.states.expandRows = data.slice();
		} else if (rowKey) {
			const expandRowsMap = getKeysMap(expandRows, rowKey);
			store.states.expandRows = data.reduce((prev: any[], row: any) => {
				const rowId = getRowIdentity(row, rowKey);
				const rowInfo = expandRowsMap[rowId];
				if (rowInfo) {
					prev.push(row);
				}
				return prev;
			}, []);
		} else {
			store.states.expandRows = [];
		}
	}

	toggle(row: any, expanded?: boolean) {
		const store = this.store;

		const { expandRows } = store.states;
		const changed = store.toggleRowStatus(expandRows, row, expanded);
		if (changed) {
			store.table.emit('expand-change', row, expandRows.slice());
			// @ts-ignore
			store.scheduleLayout();
		}
	}

	reset(ids: any[]) {
		const store = this.store;
		store.checkRowKey();

		const { data, rowKey } = store.states;
		const keysMap = getKeysMap(data, rowKey);
		store.states.expandRows = ids.reduce((prev, cur) => {
			const info = keysMap[cur];
			if (info) {
				prev.push(info.row);
			}
			return prev;
		}, []);
	}

	isExpanded(row: any) {
		const { expandRows = [], rowKey } = this.store.states;
		if (rowKey) {
			const expandMap = getKeysMap(expandRows, rowKey);
			return !!expandMap[getRowIdentity(row, rowKey)];
		}
		return expandRows.indexOf(row) !== -1;
	}
}
