import {
	getCurrentInstance,
	h,
	defineComponent,
	computed,
	onBeforeMount,
	onMounted,
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

		const isSubColumn = table !== parent; // 用于多级表头
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
		onMounted(() => {
			const children = isSubColumn
				? parentNode!.instance.vnode.el!.children
				: table.hiddenColumns.value!.children;

			// DOM上
			const columnIndex = [...children].indexOf(instance.vnode.el as Element);

			table.store.column.insert(
				columnNode,
				columnIndex,
				parentNode
			);
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

			try {
				const renderDefault = slots?.default?.({ row: {}, column: {}, columnIndex: -1, rowIndex: -1 });
				if (renderDefault instanceof Array) {
					for (const childNode of renderDefault) {
						if (/^vcm?-table-column$/.test((childNode.type as Component)?.name || '')) {
							children.push(childNode);
						} else if (childNode.type === Fragment && childNode.children instanceof Array) {
							renderDefault.push(...(childNode.children as VNode[]));
						}
					}
				}
			} catch {
				children = [];
			}
			return h('div', children);
		};
	}
});
