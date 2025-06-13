/** @jsxImportSource vue */

import { getPropByPath } from '@deot/helper-utils';
import { Checkbox } from '../checkbox';
import { Icon } from '../icon';
import { Spin } from '../spin';
import { Text } from '../text';
import { VcInstance } from '../vc';

export const cellStarts = {
	default: {
		order: ''
	},
	selection: {
		width: 60,
		minWidth: 60,
		order: '',
		className: 'vc-table-column--selection'
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
export const cellForced = {
	selection: {
		renderHeader({ store }) {
			return (
				<Checkbox
					modelValue={store.states.isAllSelected}
					disabled={store.states.data && store.states.data.length === 0}
					indeterminate={store.states.selection.length > 0 && !store.states.isAllSelected}
					// @ts-ignore
					onClick={(e: any) => {
						e.stopPropagation();
						store.toggleAllSelection();
					}}
				/>
			);
		},
		renderCell({ row, column, store, rowIndex, level, selected }) {
			return (
				<Checkbox
					// @ts-ignore
					vShow={store.states.expandSelectable || level === 0}
					modelValue={selected}
					disabled={
						column.selectable
							? !column.selectable.call(null, row, rowIndex)
							: false
					}
					onChange={() => store.rowSelectedChanged(row)}
					onClick={(e: any) => e.stopPropagation()}
				/>
			);
		},
		sortable: false,
		resizable: false
	},
	index: {
		renderHeader(h, { column }) {
			return column.label || '#';
		},
		renderCell({ rowIndex, column }) {
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
		renderCell({ row, store }) {
			const classes = ['vc-table__expand-icon'];
			if (store.states.expandRows.includes(row)) {
				classes.push('is-expand');
			}
			const handleClick = (e) => {
				e.stopPropagation();
				store.expand.toggle(row);
			};
			return (
				<div class={classes} onClick={handleClick}>
					<Icon type="triangle-up" />
				</div>
			);
		},
		sortable: false,
		resizable: false,
		className: 'vc-table__expand-column'
	}
};

// Cell默认渲染value 或 formatter
export const defaultRenderCell = (rowData: any = {}) => {
	const column = rowData.column as any;
	const { prop, formatter } = column;

	let value;
	if (prop) {
		value = getPropByPath(rowData.row, prop).v;
	}

	if (formatter) {
		return column.formatter(rowData);
	}
	const line = column.line || VcInstance.options.TableColumn?.line;

	if (line && value) {
		const style = {
			// 目前左右pading为10
			// TODO: 含有border还要-1
			width: (column.realWidth || column.width) - 20 + 'px'
		};
		return (<Text style={style} line={line} value={value} />);
	}

	return value;
};

// Cell渲染前缀，如loading, expand
export const treeCellPrefix = ({ row, treeNode, store }) => {
	if (!treeNode) return null;
	const ele: any[] = [];
	const handleClick = (e) => {
		e.stopPropagation();
		store.tree.loadOrToggle(row);
	};
	if (treeNode.indent) {
		ele.push(
			<span
				class="vc-table__indent"
				style={{
					'padding-left': treeNode.indent + 'px'
				}}
			/>
		);
	}
	if (typeof treeNode.expanded === 'boolean' && !treeNode.noLazyChildren) {
		const expandClasses = {
			'vc-table__expand-icon': true,
			'is-expand': treeNode.expanded
		};

		ele.push(
			<span class={expandClasses} onClick={handleClick}>
				{
					treeNode.loading
						? <Spin size={12} />
						: <Icon type="triangle-up" />
				}
			</span>
		);
	} else {
		ele.push(
			<span class="vc-table__placeholder" />
		);
	}
	return ele;
};
