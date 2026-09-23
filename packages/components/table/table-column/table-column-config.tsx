/** @jsxImportSource vue */

import type { VNodeChild } from 'vue';
import { getPropByPath } from '@deot/helper-utils';
import { Checkbox } from '../../checkbox';
import { Icon } from '../../icon';
import { Spin } from '../../spin';
import { VcInstance } from '../../vc';
import type { TableColumnRenderData, TableColumnStates } from './table-column-node';

export const cellStarts: Record<string, Partial<TableColumnStates>> = {
	default: {},
	selection: {
		width: 60,
		minWidth: 60
	},
	expand: {
		width: 60,
		minWidth: 60
	},
	index: {
		width: 60,
		minWidth: 60
	}
};

// 这些选项不应该被覆盖
export const cellForced: Record<string, Partial<TableColumnStates>> = {
	selection: {
		renderHeader({ store }) {
			return (
				<Checkbox
					modelValue={store.states.isAllSelected}
					disabled={store.states.data && store.states.data.length === 0}
					indeterminate={store.states.selection.length > 0 && !store.states.isAllSelected}
					// @ts-ignore
					onClick={(e: MouseEvent) => {
						e.stopPropagation();
						store.selection.toggleAll();
					}}
				/>
			);
		},
		renderCell({ row, column, store, level, selected }: TableColumnRenderData) {
			return (
				<Checkbox
					// 树形子行按 expandSelectable 决定是否可选择
					// @ts-ignore
					vShow={store.table.props.expandSelectable || !level}
					modelValue={selected}
					disabled={
						// 与表头全选一致：第二个参数为行在可选择行中的下标（树形表格与展开状态无关）
						column.selectable
							? !column.selectable.call(null, row, store.selection.getIndex(row))
							: false
					}
					onChange={() => store.selection.rowChanged(row)}
					onClick={(e: MouseEvent) => e.stopPropagation()}
				/>
			);
		},
		sortable: false,
		resizable: false,
		class: 'vc-table__selection-column'
	},
	index: {
		renderHeader({ column }) {
			return column.label || '#';
		},
		renderCell({ rowIndex, column }: TableColumnRenderData) {
			let i = rowIndex + 1;
			const index = column.index;

			if (typeof index === 'number') {
				i = rowIndex + index;
			} else if (typeof index === 'function') {
				i = index(rowIndex);
			}

			return (<div>{ i }</div>);
		},
		sortable: false
	},
	expand: {
		renderHeader({ column }) {
			return column.label || '';
		},
		renderCell({ row, store }: TableColumnRenderData) {
			const handleClick = (e: MouseEvent) => {
				e.stopPropagation();
				store.expand.toggle(row);
			};
			return (
				<div
					class={['vc-table__expand-icon', { 'is-expand': store.expand.isExpanded(row) }]}
					onClick={handleClick}
				>
					<Icon type="triangle-up" />
				</div>
			);
		},
		sortable: false,
		resizable: false,
		class: 'vc-table__expand-column'
	}
};

// 列与全局均未设置时的行数：表体不截断，表头单行
const LINE_DEFAULTS = {
	line: void 0,
	headerLine: 1
};

/**
 * 文本行数：列上的值 > 全局配置 VcInstance.options.TableColumn > 默认值（LINE_DEFAULTS）
 * @param column 列
 * @param key 表体 line / 表头 headerLine
 * @returns 行数，0 为不限行数
 */
export const getColumnLine = (column: TableColumnStates, key: keyof typeof LINE_DEFAULTS): number | undefined => {
	return column[key] ?? VcInstance.options.TableColumn?.[key] ?? LINE_DEFAULTS[key];
};

// 多行省略：line 为 0 时不限行数
export const renderTextLine = (content: VNodeChild, line?: number) => {
	return (<div class="vc-table__text-line" style={{ '-webkit-line-clamp': line || 'none' }}>{ content }</div>);
};

// Cell默认渲染value 或 formatter
export const defaultRenderCell = (rowData: TableColumnRenderData) => {
	const column = rowData.column;
	const { prop, formatter } = column;

	let value;
	if (prop) {
		value = getPropByPath(rowData.row, prop).v;
	}

	if (formatter) {
		return formatter(rowData);
	}
	const line = getColumnLine(column, 'line');

	if (line && value) {
		return renderTextLine(value, line);
	}

	return value;
};

// 表头默认渲染 label（header-line）
export const defaultRenderHeader = ({ column }: Pick<TableColumnRenderData, 'column'>) => {
	const { label } = column;
	if (!label) return label;
	return renderTextLine(label, getColumnLine(column, 'headerLine'));
};

// 树形列前缀：按层级缩进，可展开的节点显示展开图标（加载中为 Spin），叶子行以同宽占位对齐
export const treeCellPrefix = ({ row, treeNode, store }: Pick<TableColumnRenderData, 'row' | 'treeNode' | 'store'>) => {
	if (!treeNode) return null;
	const handleClick = (e: MouseEvent) => {
		e.stopPropagation();
		store.tree.toggle(row);
	};
	return [
		treeNode.indent
			? <span class="vc-table__indent" style={{ paddingLeft: `${treeNode.indent}px` }} />
			: null,
		treeNode.expandable
			? (
					<span
						class={['vc-table__expand-icon', 'vc-table__tree-icon', { 'is-expand': treeNode.expanded }]}
						onClick={handleClick}
					>
						{ treeNode.loading ? <Spin size={12} /> : <Icon type="triangle-up" /> }
					</span>
				)
			: <span class="vc-table__placeholder" />
	];
};
