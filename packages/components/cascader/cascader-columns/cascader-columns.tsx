/** @jsxImportSource vue */

import { defineComponent, ref } from 'vue';
import type { PropType } from 'vue';
import { Icon } from '../../icon/index';
import { Spin } from '../../spin/index';
import { Scroller } from '../../scroller/index';
import { SelectList } from '../../select/select-list';
import type { SelectListAlign, SelectListExposed } from '../../select/select-list';
import { findIndexByValue } from '../../select/utils';
import type { TreeData, TreeValue } from '../../select/utils';

const COMPONENT_NAME = 'vc-cascader-columns';

export interface CascaderCell {
	item: TreeData;
	columnIndex: number;
	rowIndex: number;
}

/**
 * Cascader / TreeSelect（级联模式）的级联列
 * 	- 按当前路径显示各列：第 n 列的数据为 data[n]，最多到路径的下一级，空列不显示
 * 	- 有下一级的项显示箭头（hasChildren 或 children 不为空），loading 时显示加载
 * 	- 插槽 prefix：项前面的内容（如复选框）；label：自定义文字
 * 	- inverted：向左展开，见 useColumnDirection
 */
export const CascaderColumns = defineComponent({
	name: COMPONENT_NAME,
	props: {
		// 各列的数据
		data: {
			type: Array as PropType<TreeData[][]>,
			default: () => []
		},
		// 当前路径（各级的 value）
		value: {
			type: Array as PropType<TreeValue[]>,
			default: () => []
		},
		inverted: Boolean,
		// 各列只渲染视口附近的项（见 SelectList）；列宽固定，文字超出时省略
		virtualized: Boolean
	},
	emits: ['move', 'click'],
	setup(props, { emit, slots, expose }) {
		const scroller = ref<any>();
		// 各列的列表
		const lists: Array<SelectListExposed | null> = [];

		const getColumn = (columnIndex: number) => {
			return scroller.value?.$el.querySelectorAll('.vc-cascader-column')[columnIndex] as HTMLElement | undefined;
		};

		// 把某一项滚动到所在列的可视范围
		const scrollToItem = (columnIndex: number, rowIndex: number, align?: SelectListAlign) => {
			lists[columnIndex]?.scrollToIndex(rowIndex, align);
		};

		const getCell = (e: MouseEvent): CascaderCell | undefined => {
			const el = (e.target as Element).closest<HTMLElement>('.vc-cascader-column__item');
			const column = el?.closest<HTMLElement>('.vc-cascader-column');
			if (!el || !column) return;
			const columnIndex = +column.dataset.index!;
			const rowIndex = +el.dataset.index!;
			return { item: props.data[columnIndex][rowIndex], columnIndex, rowIndex };
		};

		// 指针在某项上移动（不用 mouseenter，见 useColumnNavigate 的 handleMove）：在列区统一监听，按 data-index 找到该项
		const handleMove = (e: MouseEvent) => {
			const cell = getCell(e);
			cell && emit('move', cell);
		};

		const handleClick = (e: MouseEvent) => {
			const cell = getCell(e);
			cell && emit('click', cell);
		};

		// 各列滚动到路径上的一项（不在可视范围内时置顶）
		const scrollIntoSelected = () => {
			props.value.forEach((value, columnIndex) => {
				scrollToItem(columnIndex, findIndexByValue(props.data[columnIndex], value), 'start');
			});
		};

		expose({ getColumn, scrollToItem, scrollIntoSelected });

		const renderItem = (item: TreeData, columnIndex: number, rowIndex: number) => {
			const cell = { item, columnIndex, rowIndex };
			return (
				<div
					key={item.value}
					data-index={rowIndex}
					class={[
						'vc-cascader-column__item',
						{ 'is-select': props.value[columnIndex] == item.value, 'is-disabled': !!item.disabled }
					]}
				>
					{ slots.prefix?.(cell) }
					<span class="vc-cascader-column__label" title={props.virtualized && !slots.label ? item.label : void 0}>
						{ slots.label ? slots.label(cell) : item.label }
					</span>
					{
						item.loading
							? (<Spin size={14} class="vc-cascader-column__loading" />)
							: (item.hasChildren || item.children?.length)
									? (<Icon type="right" class="vc-cascader-column__icon" />)
									: null
					}
				</div>
			);
		};

		const renderColumn = (columnIndex: number) => {
			const list = props.data[columnIndex];
			if (!list || !list.length) return null;
			return (
				<div key={columnIndex} data-index={columnIndex} class={['vc-cascader-column', { 'is-virtual': props.virtualized }]}>
					<Scroller class="vc-cascader-column__wrapper">
						<SelectList
							ref={(vm: any) => (lists[columnIndex] = vm)}
							data={list}
							virtualized={props.virtualized}
						>
							{{ default: ({ row, index }: { row: TreeData; index: number }) => renderItem(row, columnIndex, index), $stable: true }}
						</SelectList>
					</Scroller>
				</div>
			);
		};

		return () => {
			return (
				<Scroller
					ref={scroller}
					class={['vc-cascader-columns', { 'is-inverted': props.inverted }]}
					contentClass="vc-cascader-columns__content"
					// @ts-ignore
					onMousemove={handleMove}
					onClick={handleClick}
				>
					{ Array.from({ length: props.value.length + 1 }, (_, columnIndex) => renderColumn(columnIndex)) }
				</Scroller>
			);
		};
	}
});
