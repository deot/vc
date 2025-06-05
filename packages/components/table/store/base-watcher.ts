import { reactive } from 'vue';

export class BaseWatcher {
	states = reactive({
		// 3.0 版本后要求必须设置该属性
		rowKey: null,

		// 渲染的数据来源，是对 table 中的 data 过滤排序后的结果
		_data: [] as any[],
		data: [] as any[],
		list: [] as any[],

		// 是否包含固定列
		isComplex: false,

		// 列
		_columns: [] as any[], // 动态收集vc-table-column中的columnConfig
		originColumns: [] as any[], // fixedColumns, notFixedColumns, rightFixedColumns
		columns: [] as any[], // 包括 fixedLeafColumns，leafColumns，rightFixedLeafColumns
		fixedColumns: [] as any[],
		rightFixedColumns: [] as any[],
		leafColumns: [] as any[],
		fixedLeafColumns: [] as any[],
		rightFixedLeafColumns: [] as any[],
		leafColumnsLength: 0,
		fixedLeafColumnsLength: 0,
		rightFixedLeafColumnsLength: 0,

		// 选择
		isAllSelected: false,
		selection: [] as any[],
		reserveSelection: false,
		selectable: null as any,

		hoverRow: null,

		// Current
		currentRow: null,

		// Expand
		defaultExpandAll: false,
		expandRows: [] as any[],

		// Tree
		treeExpandRowKeys: [] as any[],
		treeData: {}, // item的状态，比如loading, loaded
		treeLazy: false,
		treelazyNodeMap: {}, // 源数据
		treeLazyData: [] as any[], // 源数据展开
		treeLazyColumnIdentifier: 'hasChildren',
		treeChildrenColumnName: 'children',
	});
}
