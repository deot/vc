import { inject, ref, watch } from 'vue';
import type { Props, SortListPrimaryKey, SortListRow } from './sort-list-props';

export interface SortListCurrent {
	row: SortListRow;
	index: number;
	type?: 'left' | 'right' | 'drag' | string;
}

type SortListEmit = (event: 'update:modelValue' | 'change', value: SortListRow[]) => void;

export const useSortList = (props: Props, emit: SortListEmit) => {
	const formItem = inject<any>('vc-form-item', {});
	const currentValue = ref<SortListRow[]>([]);
	const dragging = ref(false);
	let draggingRow: SortListRow | undefined;
	let draggingElement: HTMLElement | undefined;
	let timer: ReturnType<typeof setTimeout> | undefined;

	const getPrimaryValue = (row: SortListRow, key: SortListPrimaryKey) => {
		if (row && typeof row === 'object' && key in row) {
			return row[key];
		}

		return row;
	};

	const isSameRow = (source: SortListRow, target: SortListRow) => {
		return getPrimaryValue(source, props.primaryKey) === getPrimaryValue(target, props.primaryKey);
	};

	watch(
		() => props.modelValue,
		(value) => {
			if (value === currentValue.value) return;

			currentValue.value = value || [];
		},
		{ immediate: true }
	);

	const sync = () => {
		const value = currentValue.value;

		emit('update:modelValue', value);
		emit('change', value);
		formItem.change?.(value);
	};

	const getDraggable = (row: SortListRow) => {
		if (!props.draggable) return false;
		if (!props.draggableKey) return true;

		const value = row && typeof row === 'object'
			? row[props.draggableKey]
			: undefined;

		return typeof value === 'undefined' || !!value;
	};

	const getSortList = (current: SortListCurrent) => {
		const { row, index, type } = current;
		const sourceIndex = currentValue.value.findIndex(item => isSameRow(item, row));
		const source = sourceIndex > -1 ? currentValue.value[sourceIndex] : row;
		const data = currentValue.value.filter(item => !isSameRow(item, row));

		switch (type) {
			case 'left':
				data.splice(Math.max(index - 1, 0), 0, source);
				break;
			case 'right':
				data.splice(Math.min(index + 1, data.length), 0, source);
				break;
			case 'drag':
				data.splice(Math.min(index, data.length), 0, source);
				break;
			default:
				break;
		}

		return data;
	};

	const handleClick = (e: MouseEvent, current: SortListCurrent) => {
		e.stopPropagation();
		currentValue.value = getSortList(current);
		sync();
	};

	const handleDragStart = (e: DragEvent, row: SortListRow) => {
		if (!getDraggable(row)) return;

		e.dataTransfer?.setData('text/plain', String(getPrimaryValue(row, props.primaryKey)));
		if (e.dataTransfer) {
			e.dataTransfer.effectAllowed = 'move';
		}

		const target = e.currentTarget as HTMLElement;
		target.style.opacity = '0';
		draggingElement = target;
		draggingRow = row;
		dragging.value = true;
	};

	const handleDragEnter = (e: DragEvent, index: number, row: SortListRow) => {
		if (!getDraggable(row)) return;

		e.preventDefault();
		if (!draggingRow || isSameRow(row, draggingRow)) return;
		if (timer) return;

		currentValue.value = getSortList({
			row: draggingRow,
			index,
			type: 'drag'
		});

		timer = setTimeout(() => {
			timer = undefined;
		}, 300);
	};

	const handleDragOver = (e: DragEvent, row: SortListRow) => {
		if (!getDraggable(row)) return;

		e.preventDefault();
	};

	const handleDragEnd = (e: DragEvent) => {
		e.dataTransfer?.clearData('text/plain');
		draggingElement && (draggingElement.style.opacity = '1');
		draggingElement = undefined;
		draggingRow = undefined;
		dragging.value = false;
		sync();
	};

	return {
		currentValue,
		dragging,
		getDraggable,
		getSortList,
		handleClick,
		handleDragStart,
		handleDragEnter,
		handleDragOver,
		handleDragEnd
	};
};
