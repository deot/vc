import {
	getCurrentInstance,
	h,
	defineComponent,
	computed,
	onBeforeMount,
	onMounted,
	onUpdated,
	onUnmounted,
	Fragment,
	inject,
	provide
} from 'vue';
import type { Component, VNode } from 'vue';
import { getUid } from '@deot/helper-utils';
import { tableColumnProps } from './table-column-props';
import { TableColumnNode } from './table-column-node';
import type { TableColumnProvide, TableProvide } from '../types';

export const TableColumn = defineComponent({
	name: 'vc-table-column',
	inheritAttrs: false,
	props: tableColumnProps,
	setup(props, { slots, attrs }) {
		const instance = getCurrentInstance()!;
		const table = inject<TableProvide>('vc-table')!;
		const parent = inject<TableColumnProvide | TableProvide>('vc-table-column', table);

		// 多级表头的父列
		const parentNode = 'columnNode' in parent ? parent.columnNode : void 0;

		const id = ('columnId' in parent ? parent.columnId.value : parent.tableId) + getUid('column');

		const columnNode = new TableColumnNode({
			table,
			parentNode,
			instance,
			states: { id }
		});

		onBeforeMount(() => {
			columnNode.init(props, slots, attrs);
		});
		// 位置由 store 按 DOM 顺序整理，不取挂载时的下标
		onMounted(() => {
			table.store.column.insert(columnNode, parentNode);
		});

		// 分组列重渲染后按 DOM 顺序校正子列（带 key 的子列移动不触发挂载/卸载）
		onUpdated(() => {
			columnNode.childNodes.length > 1
			&& table.store.column.sort(columnNode)
			&& table.store.scheduleLayout(true);
		});

		onUnmounted(() => {
			if (!instance.parent) return;
			table.store.column.remove(columnNode, parentNode);
		});

		provide<TableColumnProvide>('vc-table-column', {
			columnId: computed(() => columnNode.states.id),
			columnNode
		});

		/**
		 * 可以计算 columnIndex(外层需要标签元素), 即h('div')
		 * this.$slots?.default?.() 用于多级表头
		 * @returns ~
		 */
		return () => {
			let children: VNode[] = [];

			// Fragment（v-for / template）按原位置展开，保证子列的 DOM 顺序即模板顺序
			const collect = (nodes: VNode[]) => {
				for (const childNode of nodes) {
					if (/^vcm?-table-column$/.test((childNode.type as Component)?.name || '')) {
						children.push(childNode);
					} else if (childNode.type === Fragment && childNode.children instanceof Array) {
						collect(childNode.children as VNode[]);
					}
				}
			};

			try {
				const renderDefault = slots?.default?.({ row: {}, column: {}, columnIndex: -1, rowIndex: -1 });
				if (renderDefault instanceof Array) {
					collect(renderDefault);
				}
			} catch {
				children = [];
			}
			return h('div', children);
		};
	}
});
