import { nextTick, computed } from 'vue';
import { merge, concat } from 'lodash-es';
import { VcError } from '../../vc';
import { BaseWatcher } from './base-watcher';
import {
	Block,
	Column,
	Expand,
	Layout,
	Row,
	Selection,
	Tree
} from './modules';
import { flattenData } from './utils';

class Store extends BaseWatcher {
	table: any;
	row: Row;
	expand: Expand;
	tree: Tree;
	block: Block;
	column: Column;
	layout: Layout;
	selection: Selection;

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

		this.row = new Row(this);
		this.expand = new Expand(this);
		this.tree = new Tree(this);
		this.block = new Block(this);
		this.column = new Column(this);
		this.layout = new Layout(this);
		this.selection = new Selection(this);

		const { props } = options.table;
		merge(this.states, {
			expandSelectable: props.expandSelectable,
			treeLazy: props.lazy || false,
			treeLazyColumnIdentifier: props.treeMap.hasChildren || 'hasChildren',
			treeChildrenColumnName: props.treeMap.children || 'children',
		});
	}

	setData(data: any[]) {
		// 用户是否修改了数据
		const dataInstanceChanged = this.states._data !== data;

		// clone
		this.states._data = data;
		// reset
		this.states.data = data;

		this.states.list = this.block.buildInitialList(data);
		this.block.rebuildMergeList();

		/**
		 * 数据变化，更新部分数据。
		 * 没有使用 computed，而是手动更新部分数据
		 * https://github.com/vuejs/vue/issues/6660#issuecomment-331417140
		 */
		this.row.update();
		this.expand.update();
		if (!this.states.reserveSelection) {
			if (dataInstanceChanged) {
				this.selection.clear();
			} else {
				this.selection.clean();
			}
		} else {
			this.checkPrimaryKey();
			this.selection.updateByRowKey();
		}
		this.selection.updateAllSelected();
		this.updateTableScrollY();
	}

	updateColumns() {
		this.column.update();
		this.block.rebuildMergeList();
		this.column.syncToParent();
	}

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

	/**
	 * 检查 primaryKey 是否存在
	 */
	checkPrimaryKey() {
		const { primaryKey } = this.table.props;
		if (!primaryKey) {
			// throw new VcError('vc-table', 'primary-key 必传');
		}
	}

	// 适配层，expand-primary-keys 在 Expand 与 TreeTable 中都有使用
	// 这里会触发额外的计算，但为了兼容性，暂时这么做
	setExpandRowValueAdapter(val: any) {
		this.expand.reset(val);
		this.tree.expand(val);
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
