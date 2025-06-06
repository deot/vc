import { reactive } from 'vue';

export class BaseWatcher {
	states = reactive({
		// 渲染的数据来源，是对 table 中的 data 过滤排序后的结果
		_data: [] as any[],
		data: [] as any[],
		list: [] as any[],

		// 是否包含固定列
		isComplex: false,

		// 列
		_columns: [] as any[], // 动态收集vc-table-column中的columnConfig
		originColumns: [] as any[], // leftFixedColumns, notFixedColumns, rightFixedColumns
		columns: [] as any[], // 包括 leftFixedLeafColumns，leafColumns，rightFixedLeafColumns
		leftFixedColumns: [] as any[],
		rightFixedColumns: [] as any[],
		leafColumns: [] as any[],
		leftFixedLeafColumns: [] as any[],
		rightFixedLeafColumns: [] as any[],
		leafColumnsLength: 0,
		leftFixedLeafColumnsLength: 0,
		rightFixedLeafColumnsLength: 0,

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
	});
}
