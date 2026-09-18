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
	/**
	 * 参与渲染的行，行号即其下标：树形表格为按展开状态铺平后的可见行，否则同 data
	 */
	renderData: any[];
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

	hoverRowIndex: number | null;

	/**
	 * Row
	 */
	currentRow: any;

	/**
	 * Expand：显式的展开状态（key 为字符串化的行值，无行值时为行对象），未记录的行取 defaultExpandAll
	 */
	expandMap: Map<unknown, boolean>;

	/**
	 * Tree：以下均按行值记录
	 * 	- treeExpanded: 显式的展开状态，未记录的节点取 defaultExpandAll
	 * 	- treeLoading: 懒加载中的节点
	 * 	- treeLazyChildren: 懒加载得到的子行
	 */
	treeExpanded: Record<string, boolean>;
	treeLoading: Record<string, boolean>;
	treeLazyChildren: Record<string, any[]>;

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
	 * type="expand" 的叶子列，承载展开行的渲染
	 */
	expandColumn: TableColumnNodeRaw | null;
	/**
	 * 树形列：首个 default 类型的叶子列，承载缩进与展开图标
	 */
	treeColumnIndex: number;

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
		renderData: [],
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

		hoverRowIndex: null,

		currentRow: null,

		expandMap: new Map(),

		treeExpanded: {},
		treeLoading: {},
		treeLazyChildren: {},

		isComplex: computed(() => this.states.leftFixedColumns.length > 0 || this.states.rightFixedColumns.length > 0),
		hasMergeCells: computed(() => this.states.list.some((item: any) => !!item.hasMerge)),
		isGroup: computed(() => this.states.columns.length > this.states.originColumns.length),
		expandColumn: computed(() => this.states.columns.find(node => node.states.type === 'expand') || null),
		treeColumnIndex: computed(() => this.states.columns.findIndex(node => node.states.type === 'default')),

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
