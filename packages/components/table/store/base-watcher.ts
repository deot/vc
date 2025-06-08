import { reactive, computed } from 'vue';
import { concat } from 'lodash';
import { flattenData } from './utils';

export class BaseWatcher {
	states = reactive({
		// 渲染的数据来源，是对 table 中的 data 过滤排序后的结果
		_data: [] as any[],
		data: [] as any[],
		list: [] as any[],

		// 表头数据
		headerRows: [] as any[],

		// 列 动态收集vc-table-column中的columnConfig
		_columns: [] as any[],
		originColumns: [] as any[],
		notFixedColumns: [] as any[],
		leftFixedColumns: [] as any[],
		rightFixedColumns: [] as any[],

		// 选择
		isAllSelected: false,
		selection: [] as any[],
		reserveSelection: false,
		selectable: null as any,

		hoverRowIndex: null,

		// Current
		currentRow: null,

		// Expand
		defaultExpandAll: false,
		expandRows: [] as any[],

		// Tree
		treeExpandRowValue: [] as any[],
		treeData: {}, // item的状态，比如loading, loaded
		treeLazy: false,
		treelazyNodeMap: {}, // 源数据
		treeLazyData: [] as any[], // 源数据展开
		treeLazyColumnIdentifier: 'hasChildren',
		treeChildrenColumnName: 'children',

		// compputeds
		isComplex: computed(() => this.states.leftFixedColumns.length > 0 || this.states.rightFixedColumns.length > 0),
		isGroup: computed(() => this.states.columns.length > this.states.originColumns.length),

		columns: computed(() => concat(this.states.leftFixedLeafColumns, this.states.leafColumns, this.states.rightFixedLeafColumns)),
		leafColumns: computed(() => flattenData(this.states.notFixedColumns)),
		leftFixedLeafColumns: computed(() => flattenData(this.states.leftFixedColumns)),
		rightFixedLeafColumns: computed(() => flattenData(this.states.rightFixedColumns)),
		leafColumnsLength: computed(() => this.states.leafColumns.length),
		leftFixedLeafColumnsLength: computed(() => this.states.leftFixedLeafColumns.length),
		rightFixedLeafColumnsLength: computed(() => this.states.rightFixedLeafColumns.length),
	});
}
