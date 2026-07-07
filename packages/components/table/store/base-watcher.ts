import { reactive, computed } from 'vue';
import type { Raw } from 'vue';
import { concat } from 'lodash-es';
import { flattenColumnNodes } from './utils';
import type { TableColumnNode, TableColumnStates } from '../table-column/table-column-node';

type TableColumnNodeRaw = Raw<TableColumnNode>;

export class BaseWatcher {
	states = reactive({
		// 渲染的数据来源，是对 table 中的 data 过滤排序后的结果
		_data: [] as any[],
		data: [] as any[],
		list: [] as any[],

		// 表头数据
		headerRows: [] as TableColumnNodeRaw[][],

		// 列 动态收集vc-table-column中的TableColumnNode, 收集的全部列节点（列树）
		_columns: [] as TableColumnNodeRaw[],
		// 原始列 过滤hidden后的列（可见树，分组列为克隆节点，leaf 为原引用）
		originColumns: [] as TableColumnNodeRaw[],
		notFixedColumns: [] as TableColumnNodeRaw[],
		leftFixedColumns: [] as TableColumnNodeRaw[],
		rightFixedColumns: [] as TableColumnNodeRaw[],

		// 选择
		isAllSelected: false,
		selection: [] as any[],
		reserveSelection: false,
		selectable: null as TableColumnStates['selectable'] | null,
		expandSelectable: null as any,

		hoverRowIndex: null,

		// Row
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
		// 是否存在 getSpan 合并块（grid 渲染），hover 高亮等需要走 JS 控制
		hasMergeCells: computed(() => this.states.list.some((item: any) => !!item.hasMerge)),
		isGroup: computed(() => this.states.columns.length > this.states.originColumns.length),

		// 叶子列 flat 视图（元素为 leaf 节点引用；layout 写 node.states，body/footer 读 node.states）
		columns: computed(() => {
			return concat(this.states.leftFixedLeafColumns, this.states.leafColumns, this.states.rightFixedLeafColumns);
		}),
		leafColumns: computed(() => flattenColumnNodes(this.states.notFixedColumns)),
		leftFixedLeafColumns: computed(() => flattenColumnNodes(this.states.leftFixedColumns)),
		rightFixedLeafColumns: computed(() => flattenColumnNodes(this.states.rightFixedColumns)),
		leafColumnsLength: computed(() => this.states.leafColumns.length),
		leftFixedLeafColumnsLength: computed(() => this.states.leftFixedLeafColumns.length),
		rightFixedLeafColumnsLength: computed(() => this.states.rightFixedLeafColumns.length),
	});
}
