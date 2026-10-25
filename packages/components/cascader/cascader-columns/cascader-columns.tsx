/** @jsxImportSource vue */

import { defineComponent, ref } from 'vue';
import type { PropType } from 'vue';
import { Icon } from '../../icon/index';
import { Spin } from '../../spin/index';
import { Scroller } from '../../scroller/index';
import { scrollIntoScroller } from '../../select/hooks/use-navigate';
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
		inverted: Boolean
	},
	emits: ['move', 'click'],
	setup(props, { emit, slots, expose }) {
		const scroller = ref<any>();

		const getColumn = (columnIndex: number) => {
			return scroller.value?.$el.querySelectorAll('.vc-cascader-column')[columnIndex] as HTMLElement | undefined;
		};

		const getItem = (columnIndex: number, rowIndex: number) => {
			return getColumn(columnIndex)?.querySelectorAll('.vc-cascader-column__item')[rowIndex];
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
			scroller.value?.$el.querySelectorAll('.vc-cascader-column__item.is-select').forEach((el: Element) => {
				scrollIntoScroller(el, 'start');
			});
		};

		expose({ getColumn, getItem, scrollIntoSelected });

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
					<span class="vc-cascader-column__label">
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
				<div key={columnIndex} data-index={columnIndex} class="vc-cascader-column">
					<Scroller class="vc-cascader-column__wrapper">
						{ list.map((item, rowIndex) => renderItem(item, columnIndex, rowIndex)) }
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
