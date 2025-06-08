import { getValuesMap, getRowValue } from '../utils';
import type { Store } from './store';

export class Expand {
	store: Store;

	constructor(store: Store) {
		this.store = store;
	}

	update() {
		const store = this.store;
		const { primaryKey, defaultExpandAll } = this.store.table.props;
		const { data = [], expandRows } = store.states;
		if (defaultExpandAll) {
			store.states.expandRows = data.slice();
		} else if (primaryKey) {
			const expandRowsMap = getValuesMap(expandRows, primaryKey);
			store.states.expandRows = data.reduce((prev: any[], row: any) => {
				const rowId = getRowValue(row, primaryKey);
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
		store.checkPrimaryKey();

		const { primaryKey } = store.table.props;
		const { data } = store.states;
		const keysMap = getValuesMap(data, primaryKey);
		store.states.expandRows = ids.reduce((prev, cur) => {
			const info = keysMap[cur];
			if (info) {
				prev.push(info.row);
			}
			return prev;
		}, []);
	}

	isExpanded(row: any) {
		const { primaryKey } = this.store.table.props;
		const { expandRows = [] } = this.store.states;
		if (primaryKey) {
			const expandMap = getValuesMap(expandRows, primaryKey);
			return !!expandMap[getRowValue(row, primaryKey)];
		}
		return expandRows.indexOf(row) !== -1;
	}
}
