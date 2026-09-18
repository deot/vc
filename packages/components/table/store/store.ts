import { nextTick, computed } from 'vue';
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

class Store extends BaseWatcher {
	table: any;
	row: Row;
	expand: Expand;
	tree: Tree;
	block: Block;
	column: Column;
	layout: Layout;
	selection: Selection;

	/**
	 * 可选择的行：树形子行可选择（expandSelectable）时为全部行，否则为根行
	 */
	flatData = computed(() => {
		return this.table.props.expandSelectable ? this.tree.rows : this.states.data;
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
	}

	setData(data: any[]) {
		// 用户是否修改了数据
		const dataInstanceChanged = this.states._data !== data;

		// clone
		this.states._data = data;
		// reset
		this.states.data = data;

		// 清理已不存在的行的展开 / 加载状态，再按展开状态重建渲染块
		this.tree.prune();
		this.expand.prune();
		this.updateList();

		/**
		 * 数据变化，更新部分数据。
		 * 没有使用 computed，而是手动更新部分数据
		 * https://github.com/vuejs/vue/issues/6660#issuecomment-331417140
		 */
		this.row.update();
		if (!this.states.reserveSelection) {
			if (dataInstanceChanged) {
				this.selection.clear();
			} else {
				this.selection.clean();
			}
		} else {
			this.selection.updateByRowKey();
		}
		this.selection.updateAllSelected();
		this.updateTableScrollY();
	}

	/**
	 * 重建渲染块：树形表格按展开状态铺平可见行，行号即铺平后的下标
	 * data 变化、树节点展开 / 收起 / 加载、树形数据原地增删后调用
	 */
	updateList() {
		const tree = this.tree.flatten();
		this.states.renderData = tree ? tree.data : this.states.data;
		this.states.list = this.block.buildInitialList(this.states.renderData, tree?.levels);
		this.block.rebuildMergeList();
	}

	updateColumns() {
		this.column.update();
		this.block.rebuildMergeList();
		this.column.syncToParent();
	}

	/**
	 * 切换行的展开状态：存在 expand 列时为展开行，否则为树节点
	 * @param row 行数据
	 * @param expanded 指定展开与否，省略时切换
	 */
	toggleRowExpansion(row: any, expanded?: boolean) {
		if (this.states.expandColumn) {
			this.expand.toggle(row, expanded);
		} else {
			this.tree.toggle(row, expanded);
		}
	}

	/**
	 * 设置展开的行（expand-row-value），同时作用于展开行与树节点
	 * @param values 展开行的行值
	 */
	setExpandRowValue(values: any[]) {
		this.expand.reset(values);
		this.tree.reset(values);
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
