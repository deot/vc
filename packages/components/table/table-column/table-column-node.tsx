/** @jsxImportSource vue */

import { reactive, computed, watch, markRaw } from 'vue';
import type { ComponentInternalInstance, CSSProperties, Slots, SetupContext, VNodeChild } from 'vue';
import { hasOwn } from '@deot/helper-utils';
import { merge, isEmpty } from 'lodash-es';
import type { Nullable } from '@deot/helper-shared';
import { cellStarts, cellForced, defaultRenderCell, treeCellPrefix } from './table-column-confg';
import { parseWidth, parseMinWidth } from '../utils';
import type { TableColumnProps } from './table-column-props';
import type { TableProvide } from '../types';
import type { Store } from '../store/store';

/**
 * 列 states 完整形状：构造期仅初始化核心字段，props 镜像与 render 函数由 `init()` 写入。
 */
export type TableColumnStates = {
	id: string;
	type: string;

	// props 镜像（init 写入）
	line?: number;
	label?: string;
	labelClass?: string;
	prop?: string;
	width?: number;
	minWidth?: number;
	resizable?: boolean;
	align?: string;
	headerAlign?: string;
	fixed?: boolean | string;
	formatter?: (data: TableColumnRenderData) => VNodeChild;
	selectable?: (row: Record<string, unknown>, rowIndex: number) => boolean;
	reserveSelection?: boolean;
	index?: number | ((rowIndex: number) => number);
	sortable?: boolean;
	filters?: unknown[];
	filterMultiple?: boolean;
	filterIcon?: string;
	filteredValue?: unknown[];
	filterPopupClass?: string;
	filter?: (value: unknown) => void;
	tooltip?: string | ((data: Pick<TableColumnRenderData, 'column' | 'store'>) => string);

	// 注册时写入
	colspan: number;
	rowspan: number;
	class?: string;
	style?: CSSProperties;
	order?: string;

	// 派生（computed，自动解包）
	realAlign: string | null;
	realHeaderAlign: string | null;

	// store / layout 回写
	realWidth?: number;
	hidden?: boolean;
	level?: number;
	stickyOffset?: number;
	stickyStyle?: CSSProperties;
	stickyClass?: string;

	renderHeader?: (data: Pick<TableColumnRenderData, 'column' | 'columnIndex' | 'store'>) => VNodeChild;
	renderCell?: (data: TableColumnRenderData) => VNodeChild;
};

/**
 * renderCell / renderHeader / formatter 等渲染回调的入参。
 */
export interface TableColumnRenderData {
	row: Record<string, unknown>;
	column: TableColumnStates;
	rowIndex: number;
	columnIndex: number;
	store: Store;
	selected?: boolean;
	level?: number;
	isHead?: boolean;
	isTail?: boolean;
	isExpandColumn?: boolean;
	treeNode?: {
		indent?: number;
		expand?: boolean;
		noLazyChildren?: boolean;
		loading?: boolean;
	};
}

type Options = {
	table: TableProvide;
	parentNode?: Nullable<TableColumnNode>;
	instance?: ComponentInternalInstance;
	states?: Partial<TableColumnStates>;
};

// states 内的派生字段（computed），赋值时跳过
const DERIVED_KEYS = ['realAlign', 'realHeaderAlign'] as const;

const assignStates = (target: TableColumnStates, source: Partial<TableColumnStates>) => {
	for (const key in source) {
		if (!hasOwn(source, key) || (DERIVED_KEYS as readonly string[]).includes(key)) continue;
		(target as unknown as Record<string, unknown>)[key] = (source as unknown as Record<string, unknown>)[key];
	}
};

export class TableColumnNode {
	/**
	 * 列的全部响应式数据（唯一列对象）：
	 * 	- 内部（store / layout / header / body）读写 `node.states.*`；
	 * 	- 对外（slot / emit / renderCell / 用户回调）直接传该对象。
	 */
	states = (() => {
		const v = reactive({
			id: '',
			type: 'default',
			colspan: 1,
			rowspan: 1,
			align: '',
			headerAlign: '',
			minWidth: 80,
			resizable: true,
			filterMultiple: true,
			hidden: false,
			fixed: false,
			realAlign: computed(() => {
				return v.align
					? 'is-' + v.align
					: null;
			}),
			realHeaderAlign: computed(() => {
				return v.headerAlign
					? 'is-' + v.headerAlign
					: v.realAlign;
			}),
		}) as TableColumnStates;
		return v;
	})();

	childNodes: TableColumnNode[] = reactive([]);

	table!: TableProvide;
	parentNode: Nullable<TableColumnNode> = null;
	instance!: ComponentInternalInstance;

	constructor(options: Options) {
		// 节点自身不做深层代理（states / childNodes 已各自 reactive），
		// 同时保证存入 store.states 后取出的仍是原始实例（identity 稳定）
		markRaw(this);
		this.table = options.table;
		this.parentNode = options.parentNode ?? null;

		options.instance && (this.instance = options.instance);
		options.states && assignStates(this.states, options.states);
	}

	/**
	 * 兼容按 children 遍历列树的场景（如 flattenData）。
	 * leaf 返回 undefined，保持与原扁平对象一致的 truthy 判断。
	 * @returns 子节点集合（leaf 为 undefined）
	 */
	get children(): TableColumnNode[] | undefined {
		return this.childNodes.length ? this.childNodes : undefined;
	}

	/**
	 * 由组件 props 初始化 states，并绑定 props 监听
	 * 	1) defaults + cellStarts + props 合并（merge 跳过 undefined，保留 cellStarts 的宽度等预设）
	 * 	2) 特定类型的强制属性（cellForced）
	 * 	3) 宽度归一化（width/minWidth/realWidth）
	 * 	4) renderHeader / renderCell 包装
	 * @param props ~
	 * @param slots ~
	 * @param attrs ~
	 */
	init(props: TableColumnProps, slots: Slots, attrs: SetupContext['attrs']) {
		const defaults: Partial<TableColumnStates> = {
			colspan: 1,
			rowspan: 1,
			class: attrs.class as string,
			style: attrs.style as CSSProperties,
			...cellStarts[props.type],
			id: this.states.id
		};

		const propsData = Object.keys(props).reduce((pre, key) => {
			pre[key] = props[key];
			return pre;
		}, {} as Partial<TableColumnStates>);

		let column = merge(defaults, propsData);

		column = this.applyForcedProps(column);
		column = this.applyWidth(column, props);
		column = this.applyRenders(column, props, slots);

		assignStates(this.states, column);
		this.registerWatchers(props);
	}

	/**
	 * 监听 props 同步 states，并在布局相关字段变化时重排。
	 * @param props ~
	 */
	private registerWatchers(props: TableColumnProps) {
		Object.keys(props).forEach((key) => {
			watch(
				() => props[key as keyof TableColumnProps],
				(v) => { (this.states as Record<string, unknown>)[key] = v; }
			);
		});

		// 影响布局
		watch(() => props.fixed, () => {
			this.table.store.scheduleLayout(true);
		});
		watch(() => parseWidth(props.width), (v) => {
			this.states.width = v ?? undefined;
			this.states.realWidth = v ?? undefined;
			this.table.store.scheduleLayout(false);
		});
		watch(() => parseMinWidth(props.minWidth), () => {
			this.table.store.scheduleLayout(false);
		});
	}

	/**
	 * 对于特定类型的 column，某些属性不允许被覆盖
	 * 如 type: selection | index | expand
	 * @param column ~
	 * @returns ~
	 */
	private applyForcedProps(column: Partial<TableColumnStates>) {
		const source = cellForced[column.type!] || {};
		Object.keys(source).forEach((prop) => {
			const value = (source as Record<string, unknown>)[prop];
			if (value !== void 0) {
				(column as Record<string, unknown>)[prop] = prop === 'class'
					? `${column.class ? `${column.class} ` : ''}${value}`
					: value;
			}
		});
		return column;
	}

	/**
	 * width / minWidth / realWidth 归一化
	 * @param column ~
	 * @param props ~
	 * @returns ~
	 */
	private applyWidth(column: Partial<TableColumnStates>, props: TableColumnProps) {
		column.width = parseWidth(props.width) || column.width;
		column.minWidth = parseMinWidth(props.minWidth) || column.minWidth || 80;

		column.realWidth = typeof column.width === 'undefined' ? column.minWidth : column.width;
		return column;
	}

	/**
	 * column
	 *   -> renderHeader: 渲染头部
	 *   -> renderCell: 渲染单元格
	 * owner
	 * 	 -> renderExpand: 展开
	 * @param column ~
	 * @param props ~
	 * @param slots ~
	 * @returns ~
	 */
	private applyRenders(column: Partial<TableColumnStates>, props: TableColumnProps, slots: Slots) {
		const specialTypes = Object.keys(cellForced);
		// renderHeader 属性不推荐使用。
		if (props.renderHeader) {
			column.renderHeader = props.renderHeader;
		} else if (specialTypes.indexOf(column.type!) === -1) {
			column.renderHeader = (data) => {
				const renderHeader = slots.header;
				return renderHeader
					? renderHeader(data)
					: data?.column?.label;
			};
		}

		let originRenderCell = column.renderCell;
		// TODO: 这里的实现调整
		if (column.type === 'expand') {
			// 对于展开行，renderCell 不允许配置的。在上一步中已经设置过，这里需要简单封装一下。
			column.renderCell = (data: TableColumnRenderData) => (
				<div class="vc-table__cell">
					{ originRenderCell!(data) }
				</div>
			);
			this.table.renderExpand.value = (data) => {
				return slots.default
					? slots.default(data)
					: slots.default;
			};
		} else {
			originRenderCell = originRenderCell || defaultRenderCell;
			// 对 renderCell 进行包装
			column.renderCell = (data: TableColumnRenderData) => {
				const children = slots.default
					? slots?.default?.(data)
					: originRenderCell!(data);

				let prefix: VNodeChild = treeCellPrefix(data);
				// 存在树形数组，且当前行无箭头图标且处于当前展开列，表格对齐
				if (!isEmpty(this.table.store.states.treeData) && !prefix && data.isExpandColumn) {
					prefix = <span class="vc-table__unexpand__indent" />;
				}

				const { placeholder } = this.table.props;
				const contentPlaceholder = typeof placeholder === 'function' ? placeholder() : placeholder;
				return (
					<div class="vc-table__cell">
						{prefix}
						{children === undefined || children === '' || children === null ? contentPlaceholder : children}
					</div>
				);
			};
		}
		return column;
	}

	/**
	 * 浅克隆当前节点（类似 Element.prototype.cloneNode）：
	 * states 复制为独立 reactive 副本，避免 columnsToRowsEffect 写入 level/colspan/rowspan 污染原节点；
	 * 子节点默认空，由调用方传入（如 cloneVisibleTree 过滤后的可见子树）。
	 * leaf 列通常不调用，在调用方保持原引用。
	 * @param childNodes 挂载到克隆节点上的子节点
	 * @returns 克隆节点
	 */
	cloneNode(childNodes: TableColumnNode[] = []) {
		const source = { ...this.states } as Partial<TableColumnStates>;
		for (const key of DERIVED_KEYS) {
			delete (source as Record<string, unknown>)[key];
		}
		const cloned = new TableColumnNode({
			table: this.table,
			parentNode: this.parentNode,
			instance: this.instance,
			states: source
		});
		cloned.childNodes.push(...childNodes);
		return cloned;
	}
}
