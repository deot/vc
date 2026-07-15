import { reactive, computed } from 'vue';
import type { Raw } from 'vue';
import { concat } from 'lodash-es';
import { flattenColumnNodes } from './utils';
import type { TableColumnNode, TableColumnStates } from '../table-column/table-column-node';

export type TableColumnNodeRaw = Raw<TableColumnNode>;

export type TableStates = {
	/**
	 * 渲染的数据来源，是对 table 中的 data 过滤排序后的结果
	 */
	_data: any[];
	data: any[];
	list: any[];

	/**
	 * 表头数据
	 */
	headerRows: TableColumnNodeRaw[][];

	/**
	 * 列 动态收集vc-table-column中的TableColumnNode, 收集的全部列节点（列树）
	 */
	_columns: TableColumnNodeRaw[];
	/**
	 * 原始列 过滤hidden后的列（可见树，分组列为克隆节点，leaf 为原引用）
	 */
	originColumns: TableColumnNodeRaw[];
	notFixedColumns: TableColumnNodeRaw[];
	leftFixedColumns: TableColumnNodeRaw[];
	rightFixedColumns: TableColumnNodeRaw[];

	/**
	 * 选择
	 */
	isAllSelected: boolean;
	selection: any[];
	reserveSelection: boolean;
	selectable: TableColumnStates['selectable'] | null;
	expandSelectable: any;

	hoverRowIndex: number | null;

	/**
	 * Row
	 */
	currentRow: any;

	/**
	 * Expand
	 */
	defaultExpandAll: boolean;
	expandRows: any[];

	/**
	 * Tree
	 */
	treeExpandRowValue: any[];
	/**
	 * item的状态，比如loading, loaded
	 */
	treeData: Record<string, any>;
	treeLazy: boolean;
	/**
	 * 源数据
	 */
	treelazyNodeMap: Record<string, any>;
	/**
	 * 源数据展开
	 */
	treeLazyData: any[];
	treeLazyColumnIdentifier: string;
	treeChildrenColumnName: string;

	/**
	 * computeds
	 */
	isComplex: boolean;
	/**
	 * 是否存在 getSpan 合并块（grid 渲染），hover 高亮等需要走 JS 控制
	 */
	hasMergeCells: boolean;
	isGroup: boolean;

	/**
	 * 叶子列 flat 视图（元素为 leaf 节点引用；layout 写 node.states，body/footer 读 node.states）
	 */
	columns: TableColumnNodeRaw[];
	leafColumns: TableColumnNodeRaw[];
	leftFixedLeafColumns: TableColumnNodeRaw[];
	rightFixedLeafColumns: TableColumnNodeRaw[];
	leafColumnsLength: number;
	leftFixedLeafColumnsLength: number;
	rightFixedLeafColumnsLength: number;
};

export class BaseWatcher {
	states: TableStates = reactive({
		_data: [],
		data: [],
		list: [],

		headerRows: [],

		_columns: [],
		originColumns: [],
		notFixedColumns: [],
		leftFixedColumns: [],
		rightFixedColumns: [],

		isAllSelected: false,
		selection: [],
		reserveSelection: false,
		selectable: null,
		expandSelectable: null,

		hoverRowIndex: null,

		currentRow: null,

		defaultExpandAll: false,
		expandRows: [],

		treeExpandRowValue: [],
		treeData: {},
		treeLazy: false,
		treelazyNodeMap: {},
		treeLazyData: [],
		treeLazyColumnIdentifier: 'hasChildren',
		treeChildrenColumnName: 'children',

		isComplex: computed(() => this.states.leftFixedColumns.length > 0 || this.states.rightFixedColumns.length > 0),
		hasMergeCells: computed(() => this.states.list.some((item: any) => !!item.hasMerge)),
		isGroup: computed(() => this.states.columns.length > this.states.originColumns.length),

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
