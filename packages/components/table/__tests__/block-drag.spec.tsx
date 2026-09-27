// @vitest-environment jsdom

import { Table, TableColumn } from '@deot/vc-components';
import { mount } from '@vue/test-utils';
import { effect, isReactive, nextTick, reactive, ref, toRaw } from 'vue';
import { vi } from 'vitest';
import { Drag } from '../store/modules';

const sleep = (ms = 0) => new Promise<void>(r => setTimeout(r, ms));

const flush = async () => {
	await nextTick();
	await sleep(0);
	await nextTick();
};

// jsdom 没有排版：按块的起始行号与行数模拟纵向布局（表头 60-100，表体从 100 开始，每行 40）
const ROW = 40;
const BODY_TOP = 100;

const toRect = (top: number, height: number) => ({
	top,
	bottom: top + height,
	left: 0,
	right: 600,
	width: 600,
	height,
	x: 0,
	y: top,
	toJSON: () => ({})
} as DOMRect);

// 块覆盖的行数：块内单元格涉及的不同行号
const getBlockRows = (el: Element) => {
	const rows = new Set(Array.from(el.querySelectorAll(':scope > .vc-table__td[data-row]')).map(cell => (cell as HTMLElement).dataset.row));
	return rows.size || 1;
};

// 覆盖表体视口高度（设置了 maxHeight 等场景）；null 时为全部行的高度
let bodyHeight: number | null = null;

// 块整体上移的距离（模拟拖拽中滚动）
let shift = 0;

const mockLayout = () => vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
	const el = this as HTMLElement;
	if (el.classList.contains('drag-container')) return toRect(0, 300);
	if (el.dataset?.rowStart != null) {
		return toRect(BODY_TOP + Number(el.dataset.rowStart) * ROW - shift, getBlockRows(el) * ROW);
	}
	const classList = el.classList;
	if (classList.contains('vc-table__body-wrapper')) {
		const blocks = Array.from(el.querySelectorAll<HTMLElement>('[data-row-start]'));
		const rows = blocks.reduce((pre, block) => Math.max(pre, Number(block.dataset.rowStart) + getBlockRows(block)), 0);
		return toRect(BODY_TOP, bodyHeight ?? rows * ROW);
	}
	if (classList.contains('vc-table__header-wrapper')) return toRect(BODY_TOP - ROW, ROW);
	if (classList.contains('vc-table')) return toRect(0, 1000);
	return toRect(0, 0);
});

// 第 r 行的纵向中心
const rowY = (r: number) => BODY_TOP + r * ROW + ROW / 2;

const press = (el: Element, clientY: number) => {
	const e = new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 0, buttons: 1, clientX: 10, clientY });
	el.dispatchEvent(e);
	return e;
};

const moveTo = async (clientY: number, clientX = 10) => {
	window.dispatchEvent(new MouseEvent('mousemove', { cancelable: true, buttons: 1, clientX, clientY }));
	await sleep(30);
};

const release = () => {
	window.dispatchEvent(new MouseEvent('mouseup', {}));
};

// 从第 from 行按下（el 为该行内的元素），越过阈值后拖到纵坐标 toY（不松手）
const startDrag = async (el: Element, from: number, toY: number, toX = 10) => {
	press(el, rowY(from));
	await moveTo(rowY(from) + 10);
	await moveTo(toY, toX);
};

// 拖到纵坐标 toY 后松手
const dragTo = async (el: Element, from: number, toY: number) => {
	await startDrag(el, from, toY);
	release();
	await flush();
};

/**
 * 临时定义元素的只读属性（scrollHeight / clientHeight 等），返回 restore
 * @param el 元素
 * @param values 属性与值
 * @returns restore
 */
const defineProps = (el: Element, values: Record<string, number>) => {
	Object.keys(values).forEach((key) => {
		Object.defineProperty(el, key, { configurable: true, writable: true, value: values[key] });
	});
	return () => Object.keys(values).forEach(key => delete (el as any)[key]);
};

// 触摸事件：jsdom 下用普通 Event 挂上 touches / changedTouches
const fireTouch = (el: EventTarget, type: 'touchstart' | 'touchmove' | 'touchend', clientY: number) => {
	const e = new Event(type, { bubbles: true, cancelable: true }) as any;
	const touches = [{ clientX: 10, clientY }];
	e.touches = type === 'touchend' ? [] : touches;
	e.changedTouches = touches;
	el.dispatchEvent(e);
	return e as Event;
};

const buildData = (length: number) => Array.from({ length }).map((_, index) => ({
	id: `id__${index}`,
	name: `name-${index}`
}));

const cellOf = (wrapper: any, row: number, column: number) => {
	return wrapper.find(`.vc-table__body-wrapper .vc-table__td[data-row="${row}"][data-column="${column}"]`);
};

const names = (wrapper: any, column = 1) => {
	return wrapper.findAll(`.vc-table__body-wrapper .vc-table__td[data-column="${column}"]`).map((td: any) => td.text());
};

// 变暗的块的行号
const dimmedOf = (wrapper: any) => wrapper.findAll('.vc-table__body-wrapper [data-row-start]')
	.filter((el: any) => el.classes('is-dragging'))
	.map((el: any) => el.attributes('data-row-start'));

describe('table/block-drag', () => {
	let restoreLayout: ReturnType<typeof mockLayout>;

	beforeEach(() => {
		restoreLayout = mockLayout();
	});

	afterEach(() => {
		restoreLayout.mockRestore();
		bodyHeight = null;
		shift = 0;
		document.body.innerHTML = '';
	});

	it('Drag#getMove: 前后移动、多行块与顺序不变', () => {
		const drag = new Drag({} as any);
		const block = (rowStart: number, count = 1) => ({ rowStart, rows: Array.from({ length: count }) });
		const move = (from: number, to: number) => ({ from: { parent: null, index: from }, to: { parent: null, index: to } });

		expect(drag.getMove(block(0), block(2), 'after')).toEqual(move(0, 2));
		expect(drag.getMove(block(0), block(2), 'before')).toEqual(move(0, 1));
		expect(drag.getMove(block(3, 2), block(0), 'before')).toEqual(move(3, 0));
		expect(drag.getMove(block(0, 3), block(4), 'after')).toEqual(move(0, 2));
		// 自身、紧邻的前后位置：顺序不变
		expect(drag.getMove(block(1), block(1), 'before')).toBeNull();
		expect(drag.getMove(block(1), block(1), 'after')).toBeNull();
		expect(drag.getMove(block(1), block(2), 'before')).toBeNull();
		expect(drag.getMove(block(1), block(0), 'after')).toBeNull();
	});

	it('type="drag" 列渲染浅色把手，表头为空', async () => {
		const tableRef = ref<any>();
		const wrapper = mount(() => (
			<Table ref={tableRef} data={buildData(3)} primaryKey="id">
				<TableColumn type="drag" />
				<TableColumn label="名称" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();

		const handles = wrapper.findAll('.vc-table__body-wrapper .vc-table__drag-handle');
		expect(handles.length).toBe(3);
		expect(handles.every(item => item.find('.vc-icon').exists())).toBe(true);
		expect(handles.some(item => item.classes('is-disabled'))).toBe(false);
		expect(wrapper.findAll('.vc-table__th')[0].text()).toBe('');

		const column = tableRef.value.store.states.columns[0].states;
		expect(column.width).toBe(60);
		expect(column.class).toContain('vc-table__drag-column');
		// 未开启整行拖拽：整行没有 move 光标
		expect(wrapper.findAll('.vc-table__body-wrapper .is-draggable').length).toBe(0);
		wrapper.unmount();
	});

	it('Drag#getBlockByRowIndex 不订阅 list：把手在渲染中查找，list 整体替换不触发', async () => {
		const tableRef = ref<any>();
		const wrapper = mount(() => (
			<Table ref={tableRef} data={buildData(3)} primaryKey="id">
				<TableColumn type="drag" />
				<TableColumn label="名称" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();

		const { store } = tableRef.value;
		const runs = vi.fn();
		const runner = effect(() => {
			runs();
			store.drag.getBlockByRowIndex(1);
		});
		store.states.list = [...store.states.list];
		expect(runs).toHaveBeenCalledTimes(1);
		// 找到的块经响应式代理返回，仍按块追踪
		expect(isReactive(store.drag.getBlockByRowIndex(1))).toBe(true);
		expect(store.drag.getBlockByRowIndex(3)).toBeNull();
		expect(store.drag.getBlockByRowIndex(-1)).toBeNull();
		runner.effect.stop();
		wrapper.unmount();
	});

	it('整行拖拽：v-model:data 写回新顺序，事件依次为 start / drop / end', async () => {
		const data = ref(buildData(5));
		const events: string[] = [];
		const onDrop = vi.fn(() => events.push('drop'));
		const onStart = vi.fn(() => events.push('start'));
		const onEnd = vi.fn(() => events.push('end'));
		const onUpdate = vi.fn((v: any[]) => {
			events.push('update');
			data.value = v;
		});
		const wrapper = mount(() => (
			<Table
				data={data.value}
				primaryKey="id"
				draggable
				onBlockDragStart={onStart}
				onBlockDrop={onDrop}
				onBlockDragEnd={onEnd}
				{...{ 'onUpdate:data': onUpdate }}
			>
				<TableColumn type="index" />
				<TableColumn label="名称" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();
		// 没有把手列：整行 move 光标
		expect(wrapper.findAll('.vc-table__body-wrapper .vc-table__tr.is-draggable').length).toBe(5);

		const source = data.value[0];
		// 第 0 行拖到第 2 行下半部分：落在第 2 行之后
		await dragTo(cellOf(wrapper, 0, 1).element, 0, rowY(2) + 10);

		expect(events).toEqual(['start', 'update', 'drop', 'end']);
		expect(onStart).toHaveBeenCalledWith({ rows: [expect.objectContaining({ id: 'id__0' })], rowIndex: 0 });
		const payload = (onDrop.mock.calls[0] as any[])[0];
		expect(payload).toMatchObject({ position: 'after', oldIndex: 0, newIndex: 2 });
		expect(payload.rows.map((row: any) => row.id)).toEqual(['id__0']);
		expect(payload.targetRows.map((row: any) => row.id)).toEqual(['id__2']);
		expect(payload.rawData.map((row: any) => row.id)).toEqual(['id__1', 'id__2', 'id__0', 'id__3', 'id__4']);
		// 行对象引用不变（外部数组中存放的原始行）
		expect(payload.rawData[2]).toBe(toRaw(source));
		expect(onEnd).toHaveBeenCalledWith({ rows: [expect.objectContaining({ id: 'id__0' })], rowIndex: 0, dropped: true });

		expect(names(wrapper)).toEqual(['name-1', 'name-2', 'name-0', 'name-3', 'name-4']);
		// 序号列随新顺序
		expect(names(wrapper, 0)).toEqual(['1', '2', '3', '4', '5']);
		wrapper.unmount();
	});

	it('拖动中：跟随行、插入线、源块变暗、body 类名；结束后清理', async () => {
		const tableRef = ref<any>();
		const wrapper = mount(() => (
			<Table ref={tableRef} data={buildData(4)} primaryKey="id" draggable>
				<TableColumn label="名称" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();

		const root = wrapper.element as HTMLElement;
		await startDrag(cellOf(wrapper, 1, 0).element, 1, rowY(3) + 10);
		await flush();

		const ghost = root.querySelector('.vc-table__drag-ghost') as HTMLElement;
		const indicator = root.querySelector('.vc-table__drop-indicator') as HTMLElement;
		expect(ghost).toBeTruthy();
		expect(ghost.getAttribute('aria-hidden')).toBe('true');
		// 跟随行是块的克隆，不参与命中
		expect(ghost.querySelector('[data-row-start]')).toBeNull();
		expect(ghost.textContent).toContain('name-1');
		expect(indicator.style.display).toBe('');
		// 插入线在第 3 行之后
		expect(indicator.style.top).toBe(`${BODY_TOP + 4 * ROW}px`);
		expect(document.body.classList.contains('vc-table-block-dragging')).toBe(true);
		expect(wrapper.find('.vc-table__body-wrapper [data-row-start="1"]').classes()).toContain('is-dragging');
		expect(tableRef.value.store.states.dragBlock).toBeTruthy();

		release();
		await flush();
		expect(root.querySelector('.vc-table__drag-ghost')).toBeNull();
		expect(root.querySelector('.vc-table__drop-indicator')).toBeNull();
		expect(document.body.classList.contains('vc-table-block-dragging')).toBe(false);
		expect(wrapper.findAll('.vc-table__body-wrapper .is-dragging').length).toBe(0);
		expect(tableRef.value.store.states.dragBlock).toBeNull();
		wrapper.unmount();
	});

	it('阈值内的移动视为点击；拖拽松手后的 click 被吞掉', async () => {
		const onRowClick = vi.fn();
		const onStart = vi.fn();
		const wrapper = mount(() => (
			<Table data={buildData(3)} primaryKey="id" draggable onRowClick={onRowClick} onBlockDragStart={onStart}>
				<TableColumn label="名称" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();

		const cell = cellOf(wrapper, 0, 0).element;
		press(cell, rowY(0));
		await moveTo(rowY(0) + 3);
		release();
		cell.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		await flush();
		expect(onStart).not.toHaveBeenCalled();
		expect(onRowClick).toHaveBeenCalledTimes(1);

		const onOutsideClick = vi.fn();
		document.body.addEventListener('click', onOutsideClick);
		try {
			await startDrag(cell, 0, rowY(2) + 10);
			release();
			cell.dispatchEvent(new MouseEvent('click', { bubbles: true }));
			// 表格外的点击（如在表格外松手）不受影响
			document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
			expect(onStart).toHaveBeenCalledTimes(1);
			expect(onRowClick).toHaveBeenCalledTimes(1);
			expect(onOutsideClick).toHaveBeenCalledTimes(1);
		} finally {
			document.body.removeEventListener('click', onOutsideClick);
		}

		// 只吞掉紧随松手的那一次
		await sleep(10);
		cellOf(wrapper, 0, 0).element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		expect(onRowClick).toHaveBeenCalledTimes(2);
		wrapper.unmount();
	});

	it('锚点拖拽：只从把手发起；整行拖拽时交互元素处按下不发起', async () => {
		const onStart = vi.fn();
		const w1 = mount(() => (
			<Table data={buildData(3)} primaryKey="id" onBlockDragStart={onStart}>
				<TableColumn type="drag" />
				<TableColumn label="名称" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();

		await dragTo(cellOf(w1, 0, 1).element, 0, rowY(2) + 10);
		expect(onStart).not.toHaveBeenCalled();
		await dragTo(cellOf(w1, 0, 0).find('.vc-table__drag-handle .vc-icon').element, 0, rowY(2) + 10);
		expect(onStart).toHaveBeenCalledTimes(1);
		w1.unmount();

		const onStart2 = vi.fn();
		const w2 = mount(() => (
			<Table data={buildData(3)} primaryKey="id" draggable onBlockDragStart={onStart2}>
				<TableColumn type="selection" />
				<TableColumn label="名称" prop="name">
					{{ default: () => <input class="remark" /> }}
				</TableColumn>
			</Table>
		), { attachTo: document.body });
		await flush();

		await dragTo(cellOf(w2, 0, 1).find('input').element, 0, rowY(2) + 10);
		await dragTo(cellOf(w2, 0, 0).find('.vc-checkbox').element, 0, rowY(2) + 10);
		expect(onStart2).not.toHaveBeenCalled();
		// 单元格其它位置可以发起
		await dragTo(cellOf(w2, 0, 1).element, 0, rowY(2) + 10);
		expect(onStart2).toHaveBeenCalledTimes(1);
		w2.unmount();
	});

	it('allowDrag / allowDrop：不可拖动的块把手置灰；不可放置时插入线禁用且不写回', async () => {
		const onUpdate = vi.fn();
		const onEnd = vi.fn();
		const allowDrop = vi.fn(({ targetRows }: any) => targetRows[0].id !== 'id__3');
		const wrapper = mount(() => (
			<Table
				data={buildData(4)}
				primaryKey="id"
				allowDrag={({ rows }: any) => rows[0].id !== 'id__1'}
				allowDrop={allowDrop}
				onBlockDragEnd={onEnd}
				{...{ 'onUpdate:data': onUpdate }}
			>
				<TableColumn type="drag" />
				<TableColumn label="名称" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();

		const handles = wrapper.findAll('.vc-table__body-wrapper .vc-table__drag-handle');
		expect(handles.map(item => item.classes('is-disabled'))).toEqual([false, true, false, false]);

		// 不可拖动的块
		await dragTo(handles[1].element, 1, rowY(3) + 10);
		expect(onEnd).not.toHaveBeenCalled();

		// 落到第 3 行（不允许）
		await startDrag(handles[0].element, 0, rowY(3) + 10);
		const indicator = wrapper.element.querySelector('.vc-table__drop-indicator') as HTMLElement;
		expect(indicator.classList.contains('is-disabled')).toBe(true);
		expect(allowDrop).toHaveBeenLastCalledWith({
			rows: [expect.objectContaining({ id: 'id__0' })],
			targetRows: [expect.objectContaining({ id: 'id__3' })],
			position: 'after',
			from: { parent: null, index: 0 },
			to: { parent: null, index: 3 }
		});
		release();
		await flush();
		expect(onUpdate).not.toHaveBeenCalled();
		expect(onEnd).toHaveBeenLastCalledWith(expect.objectContaining({ dropped: false }));
		wrapper.unmount();
	});

	it('顺序不变的落点不显示插入线、不写回；Esc 取消', async () => {
		const onUpdate = vi.fn();
		const onEnd = vi.fn();
		const wrapper = mount(() => (
			<Table data={buildData(4)} primaryKey="id" draggable onBlockDragEnd={onEnd} {...{ 'onUpdate:data': onUpdate }}>
				<TableColumn label="名称" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();

		const cell = cellOf(wrapper, 1, 0).element;
		// 第 1 行之后 = 原位置
		press(cell, rowY(1));
		await moveTo(rowY(1) + 10);
		const indicator = wrapper.element.querySelector('.vc-table__drop-indicator') as HTMLElement;
		expect(indicator.style.display).toBe('none');
		release();
		await flush();
		expect(onUpdate).not.toHaveBeenCalled();
		expect(onEnd).toHaveBeenLastCalledWith(expect.objectContaining({ dropped: false }));

		// Esc：取消后松手无效
		await startDrag(cell, 1, rowY(3) + 10);
		window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
		expect(wrapper.element.querySelector('.vc-table__drag-ghost')).toBeNull();
		release();
		await flush();
		expect(onUpdate).not.toHaveBeenCalled();
		expect(onEnd).toHaveBeenCalledTimes(2);
		wrapper.unmount();
	});

	it('拖拽中数据变化：取消拖拽', async () => {
		const data = ref(buildData(4));
		const onEnd = vi.fn();
		const tableRef = ref<any>();
		const wrapper = mount(() => (
			<Table ref={tableRef} data={data.value} primaryKey="id" draggable onBlockDragEnd={onEnd}>
				<TableColumn label="名称" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();

		await startDrag(cellOf(wrapper, 0, 0).element, 0, rowY(2) + 10);
		data.value = buildData(3);
		await flush();
		expect(onEnd).toHaveBeenCalledWith(expect.objectContaining({ dropped: false }));
		expect(wrapper.element.querySelector('.vc-table__drag-ghost')).toBeNull();
		expect(tableRef.value.store.states.dragBlock).toBeNull();
		wrapper.unmount();
	});

	it('拖拽中原地追加行（块仍在）：拖拽继续，松手后的新顺序包含追加的行', async () => {
		const data = ref(buildData(3));
		const onUpdate = vi.fn((v: any[]) => (data.value = v));
		const onEnd = vi.fn();
		const wrapper = mount(() => (
			<Table data={data.value} primaryKey="id" draggable onBlockDragEnd={onEnd} {...{ 'onUpdate:data': onUpdate }}>
				<TableColumn label="名称" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();

		await startDrag(cellOf(wrapper, 0, 0).element, 0, rowY(1) + 10);
		data.value.push({ id: 'id__3', name: 'name-3' });
		await flush();
		expect(onEnd).not.toHaveBeenCalled();
		expect(wrapper.element.querySelector('.vc-table__drag-ghost')).toBeTruthy();

		// 拖到追加的行（第 3 行）之后
		await moveTo(rowY(3) + 10);
		release();
		await flush();
		expect(onEnd).toHaveBeenCalledWith(expect.objectContaining({ dropped: true }));
		expect(names(wrapper, 0)).toEqual(['name-1', 'name-2', 'name-3', 'name-0']);
		wrapper.unmount();
	});

	it('写回识别：v-model 写回与副本写回都保留选中项、当前行；其它新数组仍清空选中', async () => {
		const data = ref(buildData(4));
		const copy = ref(false);
		const onSelectionChange = vi.fn();
		const tableRef = ref<any>();
		const wrapper = mount(() => (
			<Table
				ref={tableRef}
				data={data.value}
				primaryKey="id"
				draggable
				highlight
				onSelectionChange={onSelectionChange}
				{...{ 'onUpdate:data': (v: any[]) => (data.value = copy.value ? [...v] : v) }}
			>
				<TableColumn type="selection" />
				<TableColumn label="名称" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();

		const vm = tableRef.value;
		vm.toggleRowSelection(vm.store.states.data[1], true);
		vm.setCurrentRow(vm.store.states.data[2]);
		await flush();
		onSelectionChange.mockClear();

		await dragTo(cellOf(wrapper, 0, 1).element, 0, rowY(3) + 10);
		expect(names(wrapper)).toEqual(['name-1', 'name-2', 'name-3', 'name-0']);
		expect(vm.store.states.selection.map((row: any) => row.id)).toEqual(['id__1']);
		expect(vm.store.states.currentRow.id).toBe('id__2');
		expect(onSelectionChange).not.toHaveBeenCalled();
		// 选中与高亮随行移动
		expect(cellOf(wrapper, 0, 0).find('.vc-checkbox').classes()).toContain('is-checked');
		expect(cellOf(wrapper, 1, 1).classes()).toContain('current-row');

		// 写回副本
		copy.value = true;
		await dragTo(cellOf(wrapper, 3, 1).element, 3, rowY(0) - 10);
		expect(names(wrapper)).toEqual(['name-0', 'name-1', 'name-2', 'name-3']);
		expect(vm.store.states.selection.map((row: any) => row.id)).toEqual(['id__1']);
		expect(onSelectionChange).not.toHaveBeenCalled();

		// 非拖拽产生的新数组（即使是同一批行）：保持原有行为，清空选中
		data.value = [...data.value].reverse();
		await flush();
		expect(vm.store.states.selection).toEqual([]);
		expect(onSelectionChange).toHaveBeenLastCalledWith([]);
		wrapper.unmount();
	});

	it('getSpan 合并块整体移动，落点只在块边界', async () => {
		const data = ref(buildData(5));
		const onDrop = vi.fn();
		// 第 0 列：0-2 行纵向合并为一个块
		const getSpan = ({ columnIndex, row }: any) => {
			if (columnIndex !== 0) return;
			const index = data.value.findIndex(item => item.id === row.id);
			const inGroup = (i: number) => ['id__0', 'id__1', 'id__2'].includes(data.value[i]?.id);
			if (!inGroup(index)) return;
			return inGroup(index - 1) ? [0, 0] : [3, 1];
		};
		const wrapper = mount(() => (
			<Table
				data={data.value}
				primaryKey="id"
				draggable
				getSpan={getSpan}
				onBlockDrop={onDrop}
				{...{ 'onUpdate:data': (v: any[]) => (data.value = v) }}
			>
				<TableColumn label="分组" prop="id" />
				<TableColumn label="名称" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();
		expect(wrapper.find('.vc-table__body-wrapper [data-row-start="0"]').classes()).toContain('vc-table__tr-group');

		// 按住合并块中间的一行（第 1 行），拖到第 4 行之后
		press(cellOf(wrapper, 1, 1).element, rowY(1));
		await moveTo(rowY(1) + 10);
		const selfDisplay = (wrapper.element.querySelector('.vc-table__drop-indicator') as HTMLElement).style.display;
		await moveTo(rowY(4) + 10);
		release();
		await flush();

		// 块内移动不显示插入线（落点即块自身）
		expect(selfDisplay).toBe('none');
		const payload = onDrop.mock.calls[0][0];
		expect(payload.rows.map((row: any) => row.id)).toEqual(['id__0', 'id__1', 'id__2']);
		expect(payload).toMatchObject({ position: 'after', oldIndex: 0, newIndex: 2 });
		expect(names(wrapper)).toEqual(['name-3', 'name-4', 'name-0', 'name-1', 'name-2']);
		// 按新顺序重新合并
		expect(wrapper.find('.vc-table__body-wrapper [data-row-start="2"]').classes()).toContain('vc-table__tr-group');
		wrapper.unmount();
	});

	describe('树形表格', () => {
		// 默认全部展开后的可见行：0 r1(0) / 1 r1-1(1) / 2 r1-2(1) / 3 r1-2-1(2) / 4 r2(0) / 5 r3(0，未加载的懒加载节点)
		const buildTree = (): any[] => [
			{
				id: 1,
				name: 'r1',
				children: [
					{ id: 11, name: 'r1-1' },
					{ id: 12, name: 'r1-2', children: [{ id: 121, name: 'r1-2-1' }] }
				]
			},
			{ id: 2, name: 'r2' },
			{ id: 3, name: 'r3', hasChildren: true }
		];

		// 行内的纵坐标：上 / 下区域取行的上沿 / 下沿附近，中间区域取行中线
		const topOf = (r: number) => BODY_TOP + r * ROW + 5;
		const bottomOf = (r: number) => BODY_TOP + r * ROW + ROW - 5;
		// 树形列内容起点为 0（jsdom 下单元格矩形为 0），层级 l 对应横坐标 [16l, 16l + 16)
		const levelX = (level: number) => level * 16 + 5;

		// jsdom 下元素没有宽度：给表体补上可见宽度，插入线才能按层级缩进
		const mountTree = async (props: Record<string, any> = {}) => {
			const wrapper = mount(() => (
				<Table
					data={buildTree()}
					primaryKey="id"
					draggable
					defaultExpandAll
					lazyTree
					loadExpand={() => []}
					{...props}
				>
					<TableColumn type="drag" />
					<TableColumn label="名称" prop="name" />
				</Table>
			), { attachTo: document.body });
			await flush();
			defineProps(wrapper.find('.vc-table__body-wrapper').element, { clientWidth: 600 });
			return wrapper;
		};

		const indicatorOf = (wrapper: any) => wrapper.element.querySelector('.vc-table__drop-indicator') as HTMLElement;

		it('可以拖拽：被拖行连同可见子孙变暗；落在被拖子树内不可放置', async () => {
			const onStart = vi.fn();
			const wrapper = await mountTree({ onBlockDragStart: onStart });
			expect(wrapper.findAll('.vc-table__body-wrapper .vc-table__drag-handle.is-disabled').length).toBe(0);

			// 拖 r1-2（第 2 行，子行 r1-2-1 在第 3 行）
			await startDrag(cellOf(wrapper, 2, 1).element, 2, rowY(4) + 15);
			expect(onStart).toHaveBeenCalledTimes(1);
			expect(dimmedOf(wrapper)).toEqual(['2', '3']);

			// 落在子行上：不可放置
			await moveTo(rowY(3));
			expect(indicatorOf(wrapper).style.display).toBe('none');
			release();
			await flush();
			expect(wrapper.findAll('.vc-table__body-wrapper .is-dragging').length).toBe(0);
			wrapper.unmount();
		});

		it('中间区域为 inner：框住目标行，跟随行淡出；allowDrop 收到 from / to', async () => {
			const allowDrop = vi.fn(() => true);
			const wrapper = await mountTree({ allowDrop });

			// r2 拖到叶子行 r1-1 的中间：成为它的子行
			await startDrag(cellOf(wrapper, 4, 1).element, 4, rowY(1));
			const indicator = indicatorOf(wrapper);
			expect(indicator.classList.contains('is-inner')).toBe(true);
			expect(indicator.style.display).toBe('');
			expect(indicator.style.top).toBe(`${BODY_TOP + ROW}px`);
			expect(indicator.style.height).toBe(`${ROW}px`);
			expect(wrapper.element.querySelector('.vc-table__drag-ghost')!.classList.contains('is-over-inner')).toBe(true);
			expect(allowDrop).toHaveBeenLastCalledWith({
				rows: [expect.objectContaining({ id: 2 })],
				targetRows: [expect.objectContaining({ id: 11 })],
				position: 'inner',
				from: { parent: null, index: 1 },
				to: { parent: expect.objectContaining({ id: 11 }), index: 0 }
			});

			// 移到行间隙：恢复为插入线，跟随行重新显示
			await moveTo(topOf(0));
			expect(indicator.classList.contains('is-inner')).toBe(false);
			expect(indicator.style.height).toBe('');
			expect(wrapper.element.querySelector('.vc-table__drag-ghost')!.classList.contains('is-over-inner')).toBe(false);
			release();
			await flush();
			wrapper.unmount();
		});

		it('已展开父行的下方区域：放在第一个子行之前，插入线缩进一级', async () => {
			const allowDrop = vi.fn(() => true);
			const wrapper = await mountTree({ allowDrop });

			await startDrag(cellOf(wrapper, 4, 1).element, 4, bottomOf(0), levelX(0));
			const indicator = indicatorOf(wrapper);
			expect(indicator.style.display).toBe('');
			expect(indicator.style.top).toBe(`${BODY_TOP + ROW}px`);
			expect(indicator.style.left).toBe('16px');
			expect(allowDrop).toHaveBeenLastCalledWith(expect.objectContaining({
				position: 'before',
				targetRows: [expect.objectContaining({ id: 11 })],
				to: { parent: expect.objectContaining({ id: 1 }), index: 0 }
			}));
			release();
			await flush();
			wrapper.unmount();
		});

		it('子树末尾：按指针在树形列上的横向位置选层级', async () => {
			const allowDrop = vi.fn(() => true);
			const wrapper = await mountTree({ allowDrop });

			// 拖 r1-1，指针在 r1-2-1（第 3 行，层级 2）的下方区域：可接在层级 0 ~ 2
			const cell = cellOf(wrapper, 1, 1).element;
			await startDrag(cell, 1, bottomOf(3), levelX(2));
			expect(indicatorOf(wrapper).style.left).toBe('32px');
			expect(allowDrop).toHaveBeenLastCalledWith(expect.objectContaining({
				position: 'after',
				targetRows: [expect.objectContaining({ id: 121 })],
				to: { parent: expect.objectContaining({ id: 12 }), index: 1 }
			}));

			// 层级 1：放在 r1-2 之后（r1 的末尾）
			await moveTo(bottomOf(3), levelX(1));
			expect(indicatorOf(wrapper).style.left).toBe('16px');
			expect(allowDrop).toHaveBeenLastCalledWith(expect.objectContaining({
				position: 'after',
				targetRows: [expect.objectContaining({ id: 12 })],
				from: { parent: expect.objectContaining({ id: 1 }), index: 0 },
				to: { parent: expect.objectContaining({ id: 1 }), index: 1 }
			}));

			// 层级 0：等于下方行 r2 的层级，放在 r2 之前（根级）
			await moveTo(bottomOf(3), levelX(0));
			expect(indicatorOf(wrapper).style.left).toBe('0px');
			expect(allowDrop).toHaveBeenLastCalledWith(expect.objectContaining({
				position: 'before',
				targetRows: [expect.objectContaining({ id: 2 })],
				to: { parent: null, index: 1 }
			}));

			// 超出范围的横向位置按边界取
			await moveTo(bottomOf(3), levelX(5));
			expect(indicatorOf(wrapper).style.left).toBe('32px');
			release();
			await flush();
			wrapper.unmount();
		});

		it('未加载的懒加载节点不能作为 inner：按上下两半；位置不变时不显示插入线', async () => {
			const allowDrop = vi.fn(() => true);
			const wrapper = await mountTree({ allowDrop });

			// r1-1 拖到 r3 的中线上方：放在 r3 之前（不框住 r3）
			await startDrag(cellOf(wrapper, 1, 1).element, 1, rowY(5) - 5);
			expect(indicatorOf(wrapper).classList.contains('is-inner')).toBe(false);
			expect(allowDrop).toHaveBeenLastCalledWith(expect.objectContaining({
				position: 'before',
				targetRows: [expect.objectContaining({ id: 3 })],
				to: { parent: null, index: 2 }
			}));
			// r1 的下方区域：放在 r1-1 自身之前，位置不变
			await moveTo(bottomOf(0));
			expect(indicatorOf(wrapper).style.display).toBe('none');
			release();
			await flush();
			wrapper.unmount();
		});

		const ids = (rows: any[]) => rows.map(row => row.id);

		it('松手后原地修改：根级 → 子级（before）；发出 update:data（根数组的副本）与 block-drop', async () => {
			const data = ref(buildTree());
			const onDrop = vi.fn();
			const onUpdate = vi.fn();
			const wrapper = await mountTree({ 'data': data.value, 'onBlockDrop': onDrop, 'onUpdate:data': onUpdate });

			// r2（第 4 行）拖到 r1-1 的上方区域：成为 r1 的第一个子行
			await dragTo(cellOf(wrapper, 4, 1).element, 4, topOf(1));
			expect(onUpdate).toHaveBeenCalledTimes(1);
			const emitted = onUpdate.mock.calls[0][0];
			// 新数组，内容为原地修改后的根级
			expect(emitted).not.toBe(toRaw(data.value));
			expect(ids(emitted)).toEqual([1, 3]);
			const payload = onDrop.mock.calls[0][0];
			expect(payload).toMatchObject({
				position: 'before',
				from: { parent: null, index: 1 },
				to: { index: 0 },
				oldIndex: 1,
				newIndex: 0
			});
			expect(payload.to.parent.id).toBe(1);
			expect(ids(payload.rows)).toEqual([2]);
			expect(ids(payload.targetRows)).toEqual([11]);
			expect(payload.rawData).toBe(emitted);
			expect(ids(data.value)).toEqual([1, 3]);
			expect(ids(data.value[0].children)).toEqual([2, 11, 12]);

			await flush();
			expect(names(wrapper)).toEqual(['r1', 'r2', 'r1-1', 'r1-2', 'r1-2-1', 'r3']);
			wrapper.unmount();
		});

		it('异步写回根数组副本：选中项、当前行、展开状态保留', async () => {
			const data = ref(buildTree());
			const tableRef = ref<any>();
			const onSelectionChange = vi.fn();
			const wrapper = mount(() => (
				<Table
					ref={tableRef}
					data={data.value}
					primaryKey="id"
					draggable
					highlight
					defaultExpandAll
					onSelectionChange={onSelectionChange}
					// 异步写回（如接口成功后）：写回前表格已按原地修改的原数组同步过一次
					{...{ 'onUpdate:data': (v: any[]) => setTimeout(() => (data.value = v), 20) }}
				>
					<TableColumn type="drag" />
					<TableColumn label="名称" prop="name" />
				</Table>
			), { attachTo: document.body });
			await flush();
			defineProps(wrapper.find('.vc-table__body-wrapper').element, { clientWidth: 600 });
			const vm = tableRef.value;
			const source = data.value;
			vm.toggleRowSelection(data.value[1], true);
			vm.setCurrentRow(data.value[0].children[0]);
			vm.toggleRowExpansion(data.value[0].children[1], false);
			await flush();
			onSelectionChange.mockClear();

			// r2（第 3 行，r1-2 已收起）拖到 r1-1 的上方区域
			await dragTo(cellOf(wrapper, 3, 1).element, 3, topOf(1));
			await sleep(40);
			await flush();
			expect(data.value).not.toBe(source);
			expect(ids(data.value)).toEqual([1, 3]);
			expect(toRaw(vm.store.states.data)).toBe(toRaw(data.value));
			expect(ids(vm.store.states.selection)).toEqual([2]);
			expect(onSelectionChange).not.toHaveBeenCalled();
			expect(vm.store.states.currentRow.id).toBe(11);
			// r1-2 仍收起
			expect(names(wrapper)).toEqual(['r1', 'r2', 'r1-1', 'r1-2', 'r3']);
			wrapper.unmount();
		});

		it('子级 → 根级：子树随节点一起移动；同一父行内调整顺序', async () => {
			const data = ref(buildTree());
			const wrapper = await mountTree({ data: data.value });

			// r1-1 拖到 r1-2-1 下方区域的层级 1：放在 r1-2 之后（r1 的末尾）
			await startDrag(cellOf(wrapper, 1, 1).element, 1, bottomOf(3), levelX(1));
			release();
			await flush();
			expect(ids(data.value[0].children)).toEqual([12, 11]);
			expect(names(wrapper)).toEqual(['r1', 'r1-2', 'r1-2-1', 'r1-1', 'r2', 'r3']);

			// r1-2（第 1 行，子行 r1-2-1）拖到 r2（第 4 行）之后：移到根级，子行随之移动
			await dragTo(cellOf(wrapper, 1, 1).element, 1, bottomOf(4));
			await flush();
			expect(ids(data.value)).toEqual([1, 2, 12, 3]);
			expect(ids(data.value[0].children)).toEqual([11]);
			expect(ids(data.value[2].children)).toEqual([121]);
			expect(names(wrapper)).toEqual(['r1', 'r1-1', 'r2', 'r1-2', 'r1-2-1', 'r3']);
			wrapper.unmount();
		});

		it('inner：放进叶子行时新建 children 并展开（普通数组同样生效）', async () => {
			const data = buildTree();
			const wrapper = await mountTree({ data });

			// r2 拖到 r1-1 的中间
			await dragTo(cellOf(wrapper, 4, 1).element, 4, rowY(1));
			expect(ids((data[0].children as any[])[0].children)).toEqual([2]);
			expect(ids(data)).toEqual([1, 3]);

			await flush();
			expect(names(wrapper)).toEqual(['r1', 'r1-1', 'r2', 'r1-2', 'r1-2-1', 'r3']);
			// r2 位于第 2 行，层级 2
			expect(wrapper.find('.vc-table__body-wrapper [data-row-start="2"]').attributes('aria-level')).toBe('3');
			wrapper.unmount();
		});

		it('inner：放进收起的节点时追加到末尾并展开', async () => {
			const data = ref(buildTree());
			const tableRef = ref<any>();
			const wrapper = await mountTree({ ref: tableRef, data: data.value });
			tableRef.value.toggleRowExpansion(data.value[0].children[1], false);
			await flush();
			expect(names(wrapper)).toEqual(['r1', 'r1-1', 'r1-2', 'r2', 'r3']);

			// r2（第 3 行）拖到收起的 r1-2（第 2 行）中间
			await dragTo(cellOf(wrapper, 3, 1).element, 3, rowY(2));
			await flush();
			expect(ids(data.value[0].children[1].children)).toEqual([121, 2]);
			expect(names(wrapper)).toEqual(['r1', 'r1-1', 'r1-2', 'r1-2-1', 'r2', 'r3']);
			wrapper.unmount();
		});

		it('懒加载：放进已加载的懒加载节点，修改 load-expand 返回的数组', async () => {
			const data = ref(buildTree());
			const lazyChildren = [{ id: 31, name: 'r3-1' }];
			const tableRef = ref<any>();
			const wrapper = await mountTree({ ref: tableRef, data: data.value, loadExpand: () => lazyChildren });
			tableRef.value.toggleRowExpansion(data.value[2], true);
			await flush();
			expect(names(wrapper)).toEqual(['r1', 'r1-1', 'r1-2', 'r1-2-1', 'r2', 'r3', 'r3-1']);

			// r2（第 4 行）拖到 r3（第 5 行，已加载）中间：追加到懒加载的子行
			await dragTo(cellOf(wrapper, 4, 1).element, 4, rowY(5));
			await flush();
			expect(ids(lazyChildren)).toEqual([31, 2]);
			expect(ids(data.value)).toEqual([1, 3]);
			expect(names(wrapper)).toEqual(['r1', 'r1-1', 'r1-2', 'r1-2-1', 'r3', 'r3-1', 'r2']);

			// 再从懒加载的子行拖回根级：r2（第 6 行）拖到 r1 的上方区域
			await dragTo(cellOf(wrapper, 6, 1).element, 6, topOf(0));
			await flush();
			expect(ids(lazyChildren)).toEqual([31]);
			expect(ids(data.value)).toEqual([2, 1, 3]);
			wrapper.unmount();
		});

		it('选中项、当前行保留；expand-selectable=false 时移成子行的已选根行移出选中', async () => {
			const data = ref(buildTree());
			const tableRef = ref<any>();
			const wrapper = await mountTree({ ref: tableRef, data: data.value, highlight: true });
			const vm = tableRef.value;
			vm.toggleRowSelection(data.value[0].children[0], true);
			vm.setCurrentRow(data.value[0].children[1]);
			await flush();

			// r1-1 拖到 r1-2-1 下方区域的层级 0：移到根级 r2 之前
			await startDrag(cellOf(wrapper, 1, 1).element, 1, bottomOf(3), levelX(0));
			release();
			await flush();
			expect(ids(data.value)).toEqual([1, 11, 2, 3]);
			expect(ids(vm.store.states.selection)).toEqual([11]);
			expect(vm.store.states.currentRow.id).toBe(12);
			wrapper.unmount();

			const data2 = ref(buildTree());
			const tableRef2 = ref<any>();
			const onSelectionChange = vi.fn();
			const w2 = await mountTree({ ref: tableRef2, data: data2.value, expandSelectable: false, onSelectionChange });
			tableRef2.value.toggleRowSelection(data2.value[1], true);
			await flush();
			expect(ids(tableRef2.value.store.states.selection)).toEqual([2]);

			// 已选中的根行 r2 放进 r1-1：子行不可选择，移出选中项
			await dragTo(cellOf(w2, 4, 1).element, 4, rowY(1));
			await flush();
			expect(tableRef2.value.store.states.selection).toEqual([]);
			expect(onSelectionChange).toHaveBeenLastCalledWith([]);
			w2.unmount();
		});

		it('allowDrop 返回 false 时不修改数据', async () => {
			const data = ref(buildTree());
			const onDrop = vi.fn();
			const onEnd = vi.fn();
			const wrapper = await mountTree({ data: data.value, allowDrop: () => false, onBlockDrop: onDrop, onBlockDragEnd: onEnd });

			await dragTo(cellOf(wrapper, 4, 1).element, 4, rowY(1));
			expect(onDrop).not.toHaveBeenCalled();
			expect(onEnd).toHaveBeenCalledWith(expect.objectContaining({ dropped: false }));
			expect(ids(data.value)).toEqual([1, 2, 3]);
			expect(data.value[0].children[0].children).toBeUndefined();
			wrapper.unmount();
		});

		it('tree-map 自定义子行字段：放进叶子行时新建对应字段', async () => {
			const data = [
				{ id: 1, name: 'r1', items: [{ id: 11, name: 'r1-1' }] },
				{ id: 2, name: 'r2' }
			];
			const wrapper = await mountTree({ data, treeMap: { children: 'items', hasChildren: 'hasChildren' } });
			expect(names(wrapper)).toEqual(['r1', 'r1-1', 'r2']);

			// r1（第 0 行）拖到根行 r2（第 2 行）的中间
			await dragTo(cellOf(wrapper, 0, 1).element, 0, rowY(2));
			await flush();
			expect(ids(data)).toEqual([2]);
			expect(ids((data[0] as any).items)).toEqual([1]);
			expect((data[0] as any).children).toBeUndefined();
			expect(names(wrapper)).toEqual(['r2', 'r1', 'r1-1']);
			wrapper.unmount();
		});

		it('allow-drop 限制只能同级移动', async () => {
			const data = ref(buildTree());
			const onDrop = vi.fn();
			const wrapper = await mountTree({
				data: data.value,
				allowDrop: ({ from, to }: any) => from.parent === to.parent,
				onBlockDrop: onDrop
			});

			// r1-1 移到根级：换了父行，不允许
			await startDrag(cellOf(wrapper, 1, 1).element, 1, bottomOf(3), levelX(0));
			expect(indicatorOf(wrapper).classList.contains('is-disabled')).toBe(true);
			release();
			await flush();
			expect(onDrop).not.toHaveBeenCalled();
			expect(ids(data.value)).toEqual([1, 2, 3]);

			// 同一父行内（r1-2 之后）：允许
			await startDrag(cellOf(wrapper, 1, 1).element, 1, bottomOf(3), levelX(1));
			expect(indicatorOf(wrapper).classList.contains('is-disabled')).toBe(false);
			release();
			await flush();
			expect(onDrop).toHaveBeenCalledTimes(1);
			expect(ids(data.value[0].children)).toEqual([12, 11]);
			wrapper.unmount();
		});

		it('移走最后一个子行后，父行变为叶子行', async () => {
			const data = ref(buildTree());
			const wrapper = await mountTree({ data: data.value });
			const expandIcon = (row: number) => cellOf(wrapper, row, 1).find('.vc-table__tree-icon').exists();
			expect(expandIcon(2)).toBe(true);

			// r1-2-1（第 3 行，r1-2 唯一的子行）拖到 r1 的上方区域：移到根级最前
			await dragTo(cellOf(wrapper, 3, 1).element, 3, topOf(0));
			await flush();
			expect(ids(data.value)).toEqual([121, 1, 2, 3]);
			expect(data.value[1].children[1].children).toEqual([]);
			expect(names(wrapper)).toEqual(['r1-2-1', 'r1', 'r1-1', 'r1-2', 'r2', 'r3']);
			// r1-2 现为第 3 行，不再显示展开图标
			expect(expandIcon(3)).toBe(false);
			wrapper.unmount();
		});

		it('根数组存放响应式行（如由响应式状态派生的数组）：根级排序、根级与子级之间的移动都作用于被拖行', async () => {
			const data = buildTree().map(row => reactive(row));
			const wrapper = await mountTree({ data });

			// r2（第 4 行）拖到 r1 的上方区域：根级排序
			await dragTo(cellOf(wrapper, 4, 1).element, 4, topOf(0));
			await flush();
			expect(ids(data)).toEqual([2, 1, 3]);

			// r2（第 0 行）拖到 r1-1（第 2 行）的中间：根级 → 子级
			await dragTo(cellOf(wrapper, 0, 1).element, 0, rowY(2));
			await flush();
			expect(ids(data)).toEqual([1, 3]);
			expect(ids(data[0].children[0].children)).toEqual([2]);
			expect(names(wrapper)).toEqual(['r1', 'r1-1', 'r2', 'r1-2', 'r1-2-1', 'r3']);

			// r1-2（第 3 行，含子行）拖到 r3（第 5 行，最后一行）的下方区域：子级 → 根级末尾
			await startDrag(cellOf(wrapper, 3, 1).element, 3, bottomOf(5), levelX(0));
			release();
			await flush();
			expect(ids(data)).toEqual([1, 3, 12]);
			expect(ids(data[0].children)).toEqual([11]);
			expect(ids(data[2].children)).toEqual([121]);
			wrapper.unmount();
		});

		it('没有主键值的行不能作为 inner：中间区域按上下两半，拖入的行不会从表格中消失', async () => {
			const data: any[] = [...buildTree(), { name: 'r4' }];
			const wrapper = await mountTree({ data });
			expect(names(wrapper)).toEqual(['r1', 'r1-1', 'r1-2', 'r1-2-1', 'r2', 'r3', 'r4']);

			// r2（第 4 行）拖到 r4（第 6 行）中线偏下：按下半处理，放在 r4 之后
			await startDrag(cellOf(wrapper, 4, 1).element, 4, rowY(6) + 5);
			expect(indicatorOf(wrapper).classList.contains('is-inner')).toBe(false);
			release();
			await flush();
			expect(data.map(row => row.name)).toEqual(['r1', 'r3', 'r4', 'r2']);
			expect(names(wrapper)).toEqual(['r1', 'r1-1', 'r1-2', 'r1-2-1', 'r3', 'r4', 'r2']);
			wrapper.unmount();
		});

		it('不写回时（只有 :data）：之后换成同一批行的新数组，仍按新数据清空选中', async () => {
			const data = ref(buildTree());
			const tableRef = ref<any>();
			const wrapper = mount(() => (
				<Table ref={tableRef} data={data.value} primaryKey="id" draggable defaultExpandAll>
					<TableColumn type="drag" />
					<TableColumn label="名称" prop="name" />
				</Table>
			), { attachTo: document.body });
			await flush();
			defineProps(wrapper.find('.vc-table__body-wrapper').element, { clientWidth: 600 });
			const vm = tableRef.value;
			vm.toggleRowSelection(data.value[1], true);
			await flush();

			// r2（第 4 行）拖到 r1 的上方区域：原地修改，不写回
			await dragTo(cellOf(wrapper, 4, 1).element, 4, topOf(0));
			await flush();
			expect(ids(data.value)).toEqual([2, 1, 3]);
			expect(ids(vm.store.states.selection)).toEqual([2]);

			// 与拖拽无关的新数组（内容与当前 data 相同）：与非树形表格一致，清空选中
			data.value = [...data.value];
			await flush();
			expect(vm.store.states.selection).toEqual([]);
			wrapper.unmount();
		});

		it('lazy-tree：带 hasChildren、子行由数据提供的节点被移空后变为叶子行，不会再触发加载', async () => {
			const data: any[] = [
				{ id: 1, name: 'r1', hasChildren: true, children: [{ id: 11, name: 'r1-1' }] },
				{ id: 2, name: 'r2' }
			];
			const loadExpand = vi.fn(() => [{ id: 11, name: 'r1-1' }]);
			const wrapper = await mountTree({ data, loadExpand });
			expect(names(wrapper)).toEqual(['r1', 'r1-1', 'r2']);

			// r1-1（第 1 行，r1 唯一的子行）拖到 r2（第 2 行）的下方区域：移到根级末尾
			await dragTo(cellOf(wrapper, 1, 1).element, 1, bottomOf(2));
			await flush();
			expect(ids(data)).toEqual([1, 2, 11]);
			expect(names(wrapper)).toEqual(['r1', 'r2', 'r1-1']);
			expect(cellOf(wrapper, 0, 1).find('.vc-table__tree-icon').exists()).toBe(false);
			expect(loadExpand).not.toHaveBeenCalled();
			wrapper.unmount();
		});

		it('indent 为 0：各层级横向位置相同，子树末尾的间隙取下方行的层级', async () => {
			const allowDrop = vi.fn(() => true);
			const wrapper = await mountTree({ indent: 0, allowDrop });

			// r1-1（第 1 行）拖到 r1-2-1（第 3 行）的下方区域，指针正好在树形列的内容起点：放在 r2 之前（根级）
			await startDrag(cellOf(wrapper, 1, 1).element, 1, bottomOf(3), 0);
			expect(indicatorOf(wrapper).style.left).toBe('0px');
			expect(allowDrop).toHaveBeenLastCalledWith(expect.objectContaining({
				position: 'before',
				targetRows: [expect.objectContaining({ id: 2 })],
				to: { parent: null, index: 1 }
			}));
			release();
			await flush();
			wrapper.unmount();
		});

		it('收起的节点：只有它自己变暗，子行随之移动', async () => {
			const data = ref(buildTree());
			const tableRef = ref<any>();
			const wrapper = await mountTree({ ref: tableRef, data: data.value });
			tableRef.value.toggleRowExpansion(data.value[0], false);
			await flush();
			expect(names(wrapper)).toEqual(['r1', 'r2', 'r3']);

			await startDrag(cellOf(wrapper, 0, 1).element, 0, bottomOf(1));
			expect(dimmedOf(wrapper)).toEqual(['0']);
			release();
			await flush();
			expect(ids(data.value)).toEqual([2, 1, 3]);
			expect(ids(data.value[1].children)).toEqual([11, 12]);
			wrapper.unmount();
		});

		it('悬停自动展开：停在收起节点中间 600ms 后展开，拖拽继续，可以放进展开出的位置', async () => {
			const data = ref(buildTree());
			const tableRef = ref<any>();
			const onExpand = vi.fn();
			const wrapper = await mountTree({ ref: tableRef, data: data.value, onExpandChange: onExpand });
			tableRef.value.toggleRowExpansion(data.value[0], false);
			await flush();
			expect(names(wrapper)).toEqual(['r1', 'r2', 'r3']);

			// r2（第 1 行）拖到收起的 r1（第 0 行）中间，停留
			await startDrag(cellOf(wrapper, 1, 1).element, 1, rowY(0));
			await sleep(700);
			await flush();
			expect(onExpand).toHaveBeenLastCalledWith(expect.objectContaining({ id: 1 }), true, expect.anything());
			expect(names(wrapper)).toEqual(['r1', 'r1-1', 'r1-2', 'r1-2-1', 'r2', 'r3']);
			// 拖拽仍在进行，被拖行随块列表重建后仍变暗
			expect(wrapper.element.querySelector('.vc-table__drag-ghost')).toBeTruthy();
			expect(wrapper.find('.vc-table__body-wrapper [data-row-start="4"]').classes()).toContain('is-dragging');

			// 放到展开出的 r1-1 之前
			await moveTo(topOf(1));
			release();
			await flush();
			expect(ids(data.value)).toEqual([1, 3]);
			expect(ids(data.value[0].children)).toEqual([2, 11, 12]);
			wrapper.unmount();
		});

		it('悬停不足 600ms 就移开：不展开', async () => {
			const data = ref(buildTree());
			const tableRef = ref<any>();
			const wrapper = await mountTree({ ref: tableRef, data: data.value });
			tableRef.value.toggleRowExpansion(data.value[0], false);
			await flush();

			await startDrag(cellOf(wrapper, 1, 1).element, 1, rowY(0));
			await sleep(300);
			await moveTo(rowY(2));
			await sleep(500);
			await flush();
			expect(names(wrapper)).toEqual(['r1', 'r2', 'r3']);
			release();
			await flush();
			wrapper.unmount();
		});

		it('悬停自动展开未加载的懒加载节点：先加载，之后可以放入', async () => {
			const data = ref(buildTree());
			const lazyChildren = [{ id: 31, name: 'r3-1' }];
			const loadExpand = vi.fn(() => lazyChildren);
			const wrapper = await mountTree({ data: data.value, loadExpand });

			// r2（第 4 行）拖到未加载的 r3（第 5 行）中间，停留
			await startDrag(cellOf(wrapper, 4, 1).element, 4, rowY(5) - 2);
			await sleep(700);
			await flush();
			expect(loadExpand).toHaveBeenCalledTimes(1);
			expect(names(wrapper)).toEqual(['r1', 'r1-1', 'r1-2', 'r1-2-1', 'r2', 'r3', 'r3-1']);

			// 已加载：中间区域可以作为 inner
			await moveTo(rowY(5));
			expect(indicatorOf(wrapper).classList.contains('is-inner')).toBe(true);
			release();
			await flush();
			expect(ids(lazyChildren)).toEqual([31, 2]);
			wrapper.unmount();
		});

		it('同时配置 getSpan 时禁用拖拽', async () => {
			const onStart = vi.fn();
			const wrapper = await mountTree({ getSpan: () => [1, 1], onBlockDragStart: onStart });

			expect(wrapper.findAll('.vc-table__body-wrapper .is-draggable').length).toBe(0);
			const handles = wrapper.findAll('.vc-table__body-wrapper .vc-table__drag-handle');
			expect(handles.length).toBe(6);
			expect(handles.every(item => item.classes('is-disabled'))).toBe(true);
			await dragTo(handles[0].element, 0, rowY(2) + 10);
			await dragTo(cellOf(wrapper, 0, 1).element, 0, rowY(2) + 10);
			expect(onStart).not.toHaveBeenCalled();
			wrapper.unmount();
		});
	});

	it('嵌套表格：内层拖拽不触发外层', async () => {
		const onOuterStart = vi.fn();
		const onInnerStart = vi.fn();
		const wrapper = mount(() => (
			<Table data={buildData(2)} primaryKey="id" draggable expandRowValue={['id__0']} onBlockDragStart={onOuterStart}>
				<TableColumn type="expand">
					{{
						default: () => (
							<Table class="inner" data={buildData(3)} primaryKey="id" draggable onBlockDragStart={onInnerStart}>
								<TableColumn label="名称" prop="name" />
							</Table>
						)
					}}
				</TableColumn>
				<TableColumn label="名称" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();

		const innerCell = wrapper.find('.inner .vc-table__body-wrapper .vc-table__td[data-row="0"]');
		expect(innerCell.exists()).toBe(true);
		await dragTo(innerCell.element, 0, rowY(2) + 10);
		expect(onInnerStart).toHaveBeenCalledTimes(1);
		expect(onOuterStart).not.toHaveBeenCalled();
		wrapper.unmount();
	});
	it('跟随行限制在表体可见范围内（不盖住表头）', async () => {
		const wrapper = mount(() => (
			<Table data={buildData(4)} primaryKey="id" draggable>
				<TableColumn label="名称" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();

		await startDrag(cellOf(wrapper, 2, 0).element, 2, 10);
		const ghost = wrapper.element.querySelector('.vc-table__drag-ghost') as HTMLElement;
		expect(ghost.style.top).toBe(`${BODY_TOP}px`);
		release();
		await flush();
		wrapper.unmount();
	});

	it('自动滚动：表体自身可滚动（maxHeight）时靠近上下边缘滚动表体', async () => {
		bodyHeight = 200;
		const tableRef = ref<any>();
		const wrapper = mount(() => (
			<Table ref={tableRef} data={buildData(10)} primaryKey="id" draggable maxHeight={240}>
				<TableColumn label="名称" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();

		const body = tableRef.value.bodyXWrapper as HTMLElement;
		const restore = defineProps(body, { scrollHeight: 400, clientHeight: 200, scrollTop: 0 });
		try {
			// 表体下边缘内侧
			await startDrag(cellOf(wrapper, 1, 0).element, 1, BODY_TOP + 200 - 2);
			await sleep(120);
			const down = body.scrollTop;
			expect(down).toBeGreaterThan(0);
			expect(down).toBeLessThanOrEqual(200);

			// 指针在表头上：向上滚动，直到顶部
			await moveTo(BODY_TOP - 20);
			await sleep(400);
			expect(body.scrollTop).toBe(0);

			// 离开边缘：停止滚动
			await moveTo(BODY_TOP + 100);
			const still = body.scrollTop;
			await sleep(80);
			expect(body.scrollTop).toBe(still);

			release();
			await flush();
		} finally {
			restore();
			wrapper.unmount();
		}
	});

	it('自动滚动：流式高度且表体超出窗口时滚动窗口；表体完整可见时不滚动', async () => {
		const scrolling = (document.scrollingElement || document.documentElement) as HTMLElement;
		const restore = defineProps(scrolling, { scrollHeight: 2000, clientHeight: 768, scrollTop: 0 });
		try {
			// 20 行：表体 100-900，超出窗口（768）
			const w1 = mount(() => (
				<Table data={buildData(20)} primaryKey="id" draggable>
					<TableColumn label="名称" prop="name" />
				</Table>
			), { attachTo: document.body });
			await flush();
			await startDrag(cellOf(w1, 1, 0).element, 1, 766);
			await sleep(100);
			expect(scrolling.scrollTop).toBeGreaterThan(0);
			release();
			await flush();
			w1.unmount();

			// 3 行：表体 100-220 完整可见，指针靠近表体下边缘也不滚动窗口
			scrolling.scrollTop = 0;
			const w2 = mount(() => (
				<Table data={buildData(3)} primaryKey="id" draggable>
					<TableColumn label="名称" prop="name" />
				</Table>
			), { attachTo: document.body });
			await flush();
			await startDrag(cellOf(w2, 0, 0).element, 0, BODY_TOP + 3 * ROW - 2);
			await sleep(100);
			expect(scrolling.scrollTop).toBe(0);
			release();
			await flush();
			w2.unmount();
		} finally {
			restore();
		}
	});

	it('自动滚动：外层为可滚动元素时滚动该元素；纵向不可滚动的包裹元素跳过，滚动窗口', async () => {
		const wrapper = mount(() => (
			<div class="drag-container" style="overflow: auto; height: 300px;">
				<Table data={buildData(20)} primaryKey="id" draggable>
					<TableColumn label="名称" prop="name" />
				</Table>
			</div>
		), { attachTo: document.body });
		await flush();

		const container = wrapper.element as HTMLElement;
		const scrolling = (document.scrollingElement || document.documentElement) as HTMLElement;
		const restoreWindow = defineProps(scrolling, { scrollHeight: 2000, clientHeight: 768, scrollTop: 0 });
		let restore = defineProps(container, { scrollHeight: 1000, clientHeight: 300, scrollTop: 0, clientTop: 0 });
		try {
			// 容器下边缘（300）内侧
			await startDrag(cellOf(wrapper, 1, 0).element, 1, 298);
			await sleep(100);
			expect(container.scrollTop).toBeGreaterThan(0);
			expect(scrolling.scrollTop).toBe(0);
			release();
			await flush();

			// 容器纵向不可滚动（如只横向滚动的包裹元素）：跳过它，由窗口承载
			restore();
			restore = defineProps(container, { scrollHeight: 300, clientHeight: 300, scrollTop: 0, clientTop: 0 });
			await startDrag(cellOf(wrapper, 1, 0).element, 1, 766);
			await sleep(100);
			expect(container.scrollTop).toBe(0);
			expect(scrolling.scrollTop).toBeGreaterThan(0);
			release();
			await flush();
		} finally {
			restore();
			restoreWindow();
			wrapper.unmount();
		}
	});

	it('按下不阻止默认行为（焦点照常切换）；按下期间阻止文本选择与原生拖拽', async () => {
		const wrapper = mount(() => (
			<Table data={buildData(3)} primaryKey="id" draggable>
				<TableColumn type="drag" />
				<TableColumn label="名称" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();

		const cell = cellOf(wrapper, 0, 1).element;
		const down = press(cell, rowY(0));
		expect(down.defaultPrevented).toBe(false);
		const select = new Event('selectstart', { bubbles: true, cancelable: true });
		const drag = new Event('dragstart', { bubbles: true, cancelable: true });
		cell.dispatchEvent(select);
		cell.dispatchEvent(drag);
		expect(select.defaultPrevented && drag.defaultPrevented).toBe(true);
		release();

		// 松手后不再阻止
		const after = new Event('selectstart', { bubbles: true, cancelable: true });
		cell.dispatchEvent(after);
		expect(after.defaultPrevented).toBe(false);

		const handle = cellOf(wrapper, 0, 0).find('.vc-table__drag-handle').element;
		expect(press(handle, rowY(0)).defaultPrevented).toBe(false);
		release();
		wrapper.unmount();
	});

	it('只有左键松开才提交；移动时左键已松开（未收到 mouseup）则取消', async () => {
		const onUpdate = vi.fn();
		const onEnd = vi.fn();
		const wrapper = mount(() => (
			<Table data={buildData(4)} primaryKey="id" draggable onBlockDragEnd={onEnd} {...{ 'onUpdate:data': onUpdate }}>
				<TableColumn label="名称" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();

		await startDrag(cellOf(wrapper, 0, 0).element, 0, rowY(2) + 10);
		// 右键松开：仍在拖拽
		window.dispatchEvent(new MouseEvent('mouseup', { button: 2 }));
		expect(onEnd).not.toHaveBeenCalled();
		expect(wrapper.element.querySelector('.vc-table__drag-ghost')).toBeTruthy();

		// 没有按键按下的移动：取消
		window.dispatchEvent(new MouseEvent('mousemove', { buttons: 0, clientX: 10, clientY: rowY(3) }));
		await flush();
		expect(onEnd).toHaveBeenCalledWith(expect.objectContaining({ dropped: false }));
		expect(onUpdate).not.toHaveBeenCalled();
		expect(wrapper.element.querySelector('.vc-table__drag-ghost')).toBeNull();
		wrapper.unmount();
	});

	it('拖拽中滚动（滚轮、触控板）：落点与插入线随之更新', async () => {
		const wrapper = mount(() => (
			<Table data={buildData(6)} primaryKey="id" draggable>
				<TableColumn label="名称" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();

		// 指针在第 2 行下半部分：插入线在第 2 行之后
		const y = rowY(2) + 5;
		await startDrag(cellOf(wrapper, 0, 0).element, 0, y);
		const indicator = wrapper.element.querySelector('.vc-table__drop-indicator') as HTMLElement;
		expect(indicator.style.top).toBe(`${BODY_TOP + 3 * ROW}px`);

		// 表体滚动半行，指针不动：指针落在第 3 行上半部分，插入线移到第 3 行之前
		shift = ROW / 2;
		wrapper.find('.vc-table__body-wrapper').element.dispatchEvent(new Event('scroll'));
		await sleep(30);
		expect(indicator.style.top).toBe(`${BODY_TOP + 3 * ROW - shift}px`);
		release();
		await flush();
		wrapper.unmount();
	});

	it('跟随行克隆去掉 name / id：已选中的 radio 不会取消原行 radio 的选中', async () => {
		const wrapper = mount(() => (
			<Table data={buildData(3)} primaryKey="id" draggable>
				<TableColumn label="默认">
					{{ default: ({ rowIndex }: any) => <input id={`radio-${rowIndex}`} type="radio" name="default-row" checked={rowIndex === 0} /> }}
				</TableColumn>
				<TableColumn label="名称" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();

		const radio = wrapper.find('#radio-0').element as HTMLInputElement;
		expect(radio.checked).toBe(true);
		await startDrag(cellOf(wrapper, 0, 1).element, 0, rowY(2) + 10);
		const ghost = wrapper.element.querySelector('.vc-table__drag-ghost') as HTMLElement;
		expect(ghost.querySelector('input[type="radio"]')).toBeTruthy();
		expect(ghost.querySelector('[name], [id]')).toBeNull();
		expect(radio.checked).toBe(true);
		window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
		expect(radio.checked).toBe(true);
		release();
		wrapper.unmount();
	});

	it('整行 move 光标：有把手列时不显示；只作用于本表格的块（不影响嵌套表格）', async () => {
		const onStart = vi.fn();
		const w1 = mount(() => (
			<Table data={buildData(3)} primaryKey="id" draggable onBlockDragStart={onStart}>
				<TableColumn type="drag" />
				<TableColumn label="名称" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();
		expect(w1.findAll('.vc-table__body-wrapper .is-draggable').length).toBe(0);
		// 光标不显示，整行拖拽仍由 draggable 控制
		await dragTo(cellOf(w1, 0, 1).element, 0, rowY(2) + 10);
		expect(onStart).toHaveBeenCalledTimes(1);
		w1.unmount();

		const w2 = mount(() => (
			<Table data={buildData(2)} primaryKey="id" draggable expandRowValue={['id__0']}>
				<TableColumn type="expand">
					{{
						default: () => (
							<Table class="inner" data={buildData(2)} primaryKey="id">
								<TableColumn label="名称" prop="name" />
							</Table>
						)
					}}
				</TableColumn>
				<TableColumn label="名称" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();
		const outerRows = w2.findAll('.vc-table__body-wrapper [data-row-start]').filter(el => !el.element.closest('.inner'));
		expect(outerRows.length).toBe(2);
		expect(outerRows.every(el => el.classes('is-draggable'))).toBe(true);
		expect(w2.findAll('.inner .is-draggable').length).toBe(0);
		w2.unmount();
	});

	it('触摸：从把手直接拖动，拦截 touchmove 不交给表体滚动', async () => {
		const data = ref(buildData(4));
		const onUpdate = vi.fn((v: any[]) => (data.value = v));
		const wrapper = mount(() => (
			<Table data={data.value} primaryKey="id" {...{ 'onUpdate:data': onUpdate }}>
				<TableColumn type="drag" />
				<TableColumn label="名称" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();

		const body = wrapper.find('.vc-table__body-wrapper').element;
		const onBodyTouchmove = vi.fn();
		body.addEventListener('touchmove', onBodyTouchmove);

		const handle = cellOf(wrapper, 0, 0).find('.vc-table__drag-handle').element;
		fireTouch(handle, 'touchstart', rowY(0));
		const move1 = fireTouch(handle, 'touchmove', rowY(0) + 10);
		await sleep(30);
		const move2 = fireTouch(handle, 'touchmove', rowY(2) + 10);
		await sleep(30);
		expect(move1.defaultPrevented && move2.defaultPrevented).toBe(true);
		expect(onBodyTouchmove).not.toHaveBeenCalled();
		expect(wrapper.element.querySelector('.vc-table__drag-ghost')).toBeTruthy();

		fireTouch(handle, 'touchend', rowY(2) + 10);
		await flush();
		expect(onUpdate).toHaveBeenCalledTimes(1);
		expect(names(wrapper)).toEqual(['name-1', 'name-2', 'name-0', 'name-3']);
		wrapper.unmount();
	});

	it('触摸：整行需长按，长按前移动视为滚动', async () => {
		const data = ref(buildData(4));
		const onStart = vi.fn();
		const wrapper = mount(() => (
			<Table
				data={data.value}
				primaryKey="id"
				draggable
				onBlockDragStart={onStart}
				{...{ 'onUpdate:data': (v: any[]) => (data.value = v) }}
			>
				<TableColumn label="名称" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();

		const body = wrapper.find('.vc-table__body-wrapper').element;
		const onBodyTouchmove = vi.fn();
		body.addEventListener('touchmove', onBodyTouchmove);

		// 立即移动：不拖拽，touchmove 照常交给表体
		const cell = cellOf(wrapper, 0, 0).element;
		fireTouch(cell, 'touchstart', rowY(0));
		const scroll = fireTouch(cell, 'touchmove', rowY(0) + 20);
		fireTouch(cell, 'touchend', rowY(0) + 20);
		await sleep(350);
		expect(scroll.defaultPrevented).toBe(false);
		expect(onBodyTouchmove).toHaveBeenCalledTimes(1);
		expect(onStart).not.toHaveBeenCalled();

		// 长按后拖动
		fireTouch(cell, 'touchstart', rowY(0));
		await sleep(350);
		expect(onStart).toHaveBeenCalledTimes(1);
		const move = fireTouch(cell, 'touchmove', rowY(2) + 10);
		await sleep(30);
		expect(move.defaultPrevented).toBe(true);
		expect(onBodyTouchmove).toHaveBeenCalledTimes(1);
		fireTouch(cell, 'touchend', rowY(2) + 10);
		await flush();
		expect(names(wrapper, 0)).toEqual(['name-1', 'name-2', 'name-0', 'name-3']);
		wrapper.unmount();
	});
});
