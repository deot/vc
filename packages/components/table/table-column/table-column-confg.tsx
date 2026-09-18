/** @jsxImportSource vue */

import { getPropByPath } from '@deot/helper-utils';
import { Checkbox } from '../../checkbox';
import { Icon } from '../../icon';
import { Spin } from '../../spin';
import { VcInstance } from '../../vc';
import type { TableColumnRenderData, TableColumnStates } from './table-column-node';

export const cellStarts: Record<string, Partial<TableColumnStates>> = {
	default: {
		order: ''
	},
	selection: {
		width: 60,
		minWidth: 60,
		order: '',
	},
	expand: {
		width: 60,
		minWidth: 60,
		order: ''
	},
	index: {
		width: 60,
		minWidth: 60,
		order: ''
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
		renderCell({ row, column, store, rowIndex, level, selected }: TableColumnRenderData) {
			return (
				<Checkbox
					// 树形子行按 expandSelectable 决定是否可选择
					// @ts-ignore
					vShow={store.table.props.expandSelectable || !level}
					modelValue={selected}
					disabled={
						column.selectable
							? !column.selectable.call(null, row, rowIndex)
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
	const line = typeof column.line !== 'undefined'
		? column.line
		: VcInstance.options.TableColumn?.line;

	if (line && value) {
		const style = {
			'-webkit-line-clamp': line,
		};
		return (<div class="vc-table__text-line" style={style}>{ value }</div>);
	}

	return value;
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
