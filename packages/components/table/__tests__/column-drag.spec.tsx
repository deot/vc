// @vitest-environment jsdom

import { Table, TableColumn } from '@deot/vc-components';
import { mount } from '@vue/test-utils';
import { nextTick, ref } from 'vue';
import { vi } from 'vitest';
import { flattenColumnNodes } from '../store/utils';

const sleep = (ms = 0) => new Promise<void>(r => setTimeout(r, ms));

const flush = async () => {
	await nextTick();
	await sleep(0);
	await nextTick();
};

const buildData = (length: number) => Array.from({ length }).map((_, index) => ({
	id: index,
	a: `a${index}`,
	b: `b${index}`,
	c: `c${index}`,
	d: `d${index}`,
	e: `e${index}`
}));

// 列的名称：普通列取 label，结构列取 type
const nameOf = (column: any) => column.states.label || column.states.type;

// 可见叶子列的名称（渲染顺序）
const leaves = (vm: any) => vm.store.states.columns.map(nameOf);

// 某一层（默认顶层）的列名称，含隐藏列
const level = (vm: any, parent?: any) => (parent ? parent.childNodes : vm.store.states._columns).map(nameOf);

// 按名称在列树中找原列节点
const find = (vm: any, name: string) => {
	const walk = (list: any[]): any => {
		for (const column of list) {
			if (nameOf(column) === name) return column;
			const hit = column.childNodes.length && walk(column.childNodes);
			if (hit) return hit;
		}
		return null;
	};
	return walk(vm.store.states._columns);
};

/**
 * 列：selection、A、分组 G（B、C）、D、右固定 E
 * @param props Table 的属性；需要随响应式数据变化时传函数（在渲染中读取）
 * @param options 选项
 * @param options.dynamic 为 true 时在 D 之后插入 F、在 B 之后插入 B2（列带 key，与模板中 v-if 一样不复用其他列的实例）
 * @returns 挂载结果与 Table 实例
 */
const mountTable = async (props: Record<string, any> | (() => Record<string, any>) = {}, options: { dynamic?: any } = {}) => {
	const tableRef = ref<any>();
	const dynamic = options.dynamic ?? ref(false);
	const wrapper = mount(() => (
		<Table ref={tableRef} data={buildData(2)} primaryKey="id" draggable={[false, true]} {...(typeof props === 'function' ? props() : props)}>
			<TableColumn key="selection" type="selection" />
			<TableColumn key="a" label="A" prop="a" sortable />
			<TableColumn key="g" label="G">
				<TableColumn key="b" label="B" prop="b" />
				{dynamic.value ? <TableColumn key="b2" label="B2" prop="b" /> : null}
				<TableColumn key="c" label="C" prop="c" />
			</TableColumn>
			<TableColumn key="d" label="D" prop="d" />
			{dynamic.value ? <TableColumn key="f" label="F" prop="d" /> : null}
			<TableColumn key="e" label="E" prop="e" fixed="right" />
		</Table>
	), { attachTo: document.body });
	await flush();
	return { wrapper, vm: tableRef.value, dynamic };
};

// v-model:columns 的写回（在渲染函数中调用，读取最新的 columns）
const vModel = (columns: any) => ({
	'columns': columns.value,
	'onUpdate:columns': (v: any[]) => { columns.value = v; }
});

describe('table/column-drag', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	describe('v-model:columns 按层重排', () => {
		it('多级表头：写回叶子顺序后各层按排位重排（分组取叶子中最靠前的排位）；与模板一致时恢复跟随模板', async () => {
			const columns = ref<any[]>([]);
			const onUpdate = vi.fn();
			const tableRef = ref<any>();
			const wrapper = mount(() => (
				<Table
					ref={tableRef}
					data={buildData(2)}
					primaryKey="id"
					columns={columns.value}
					{...{ 'onUpdate:columns': (v: any[]) => { columns.value = v; onUpdate(v); } }}
				>
					<TableColumn type="selection" />
					<TableColumn label="A" prop="a" />
					<TableColumn label="G">
						<TableColumn label="B" prop="b" />
						<TableColumn label="C" prop="c" />
					</TableColumn>
					<TableColumn label="D" prop="d" />
				</Table>
			), { attachTo: document.body });
			await flush();
			const vm = tableRef.value;
			expect(leaves(vm)).toEqual(['selection', 'A', 'B', 'C', 'D']);
			const byLabel = (label: string) => columns.value.find((item: any) => (item.label || item.type) === label);
			const template = columns.value;

			// 写回 selection、C、B、D、A：分组 G 排在 D 之前，组内 C 在 B 之前
			columns.value = ['selection', 'C', 'B', 'D', 'A'].map(byLabel);
			await flush();
			await sleep(30);
			await flush();
			expect(leaves(vm)).toEqual(['selection', 'C', 'B', 'D', 'A']);
			expect(level(vm)).toEqual(['selection', 'G', 'D', 'A']);
			expect(level(vm, find(vm, 'G'))).toEqual(['C', 'B']);
			// 表头与表体随之重排
			expect(wrapper.findAll('.vc-table__thead .vc-table__th').map(th => th.text()).filter(Boolean)).toEqual(['G', 'D', 'A', 'C', 'B']);
			const firstRow = wrapper.findAll('.vc-table__body-wrapper .vc-table__tr')[0];
			expect(firstRow.findAll('.vc-table__td').map(td => td.text())).toEqual(['', 'c0', 'b0', 'd0', 'a0']);

			// 写回模板顺序：恢复跟随模板
			columns.value = template;
			await flush();
			await sleep(30);
			await flush();
			expect(leaves(vm)).toEqual(['selection', 'A', 'B', 'C', 'D']);
			expect(vm.store.column._sync.order).toBeNull();
			wrapper.unmount();
		});

		it('重排后新增的列跟在它在模板中的前一列之后（顶层与分组内）', async () => {
			const columns = ref<any[]>([]);
			const { vm, dynamic } = await mountTable(() => vModel(columns));
			const byLabel = (label: string) => columns.value.find((item: any) => (item.label || item.type) === label);

			columns.value = ['selection', 'D', 'C', 'B', 'A', 'E'].map(byLabel);
			await flush();
			await sleep(30);
			await flush();
			expect(leaves(vm)).toEqual(['selection', 'D', 'C', 'B', 'A', 'E']);

			// F 在模板中位于 D 之后，B2 位于 B 之后
			dynamic.value = true;
			await flush();
			await sleep(30);
			await flush();
			expect(leaves(vm)).toEqual(['selection', 'D', 'F', 'C', 'B', 'B2', 'A', 'E']);
		});
	});

	describe('Drag：列的判定与移动', () => {
		it('draggable 第二项控制列拖拽；结构列、隐藏列不可拖；allowDrag 收到 { type: column, column, columnIndex }', async () => {
			const allowDrag = vi.fn(({ column }: any) => column.label !== 'D');
			const columns = ref<any[]>([]);
			const { vm } = await mountTable(() => ({ ...vModel(columns), allowDrag }));
			const { drag } = vm.store;

			expect(drag.draggable.value).toEqual([false, true]);
			expect(drag.canDragColumn(find(vm, 'A'))).toBe(true);
			expect(allowDrag).toHaveBeenLastCalledWith({ type: 'column', column: find(vm, 'A').states, columnIndex: 1 });
			// 分组：columnIndex 为它第一个叶子的下标
			expect(drag.canDragColumn(find(vm, 'G'))).toBe(true);
			expect(allowDrag).toHaveBeenLastCalledWith({ type: 'column', column: find(vm, 'G').states, columnIndex: 2 });
			expect(drag.canDragColumn(find(vm, 'D'))).toBe(false);
			expect(drag.canDragColumn(find(vm, 'selection'))).toBe(false);

			// 隐藏的列
			columns.value = columns.value.map((item: any) => (item.label === 'A' ? { ...item, hidden: true } : item));
			await flush();
			await sleep(30);
			await flush();
			expect(drag.canDragColumn(find(vm, 'A'))).toBe(false);
		});

		it('draggable 为 true 时只开启行拖拽', async () => {
			const { vm } = await mountTable({ draggable: true });
			expect(vm.store.drag.draggable.value).toEqual([true, false]);
			expect(vm.store.drag.canDragColumn(find(vm, 'A'))).toBe(false);
		});

		it('getColumnMove：同一父级、同一固定分组的普通列之前 / 之后；顺序不变或不可放时为 null', async () => {
			const { vm } = await mountTable();
			const { drag } = vm.store;
			const move = (a: string, b: string, position: string) => drag.getColumnMove(find(vm, a), find(vm, b), position);
			const place = (parent: any, index: number) => ({ parent: parent && find(vm, parent), index });

			// 顶层：[selection, A, G, D, E]
			expect(move('A', 'D', 'after')).toEqual({ from: place(null, 1), to: place(null, 3) });
			expect(move('D', 'A', 'before')).toEqual({ from: place(null, 3), to: place(null, 1) });
			// 分组整体移动
			expect(move('G', 'A', 'before')).toEqual({ from: place(null, 2), to: place(null, 1) });
			// 分组内
			expect(move('B', 'C', 'after')).toEqual({ from: place('G', 0), to: place('G', 1) });
			// 顺序不变
			expect(move('A', 'G', 'before')).toBeNull();
			expect(move('A', 'selection', 'after')).toBeNull();
			expect(move('A', 'A', 'after')).toBeNull();
			// 跨父级
			expect(move('B', 'D', 'before')).toBeNull();
			expect(move('A', 'B', 'before')).toBeNull();
			// 跨固定分组（E 右固定）
			expect(move('D', 'E', 'after')).toBeNull();
			// 结构列不作为落点
			expect(move('G', 'selection', 'before')).toBeNull();
		});

		it('canDropColumn：allowDrop 收到 { type: column, column, targetColumn, position, from, to }，parent 为父分组的 states', async () => {
			const allowDrop = vi.fn(() => false);
			const { vm } = await mountTable({ allowDrop });
			const { drag } = vm.store;
			const [b, c, g] = ['B', 'C', 'G'].map(name => find(vm, name));
			const move = drag.getColumnMove(b, c, 'after');
			expect(drag.canDropColumn(b, c, 'after', move)).toBe(false);
			expect(allowDrop).toHaveBeenLastCalledWith({
				type: 'column',
				column: b.states,
				targetColumn: c.states,
				position: 'after',
				from: { parent: g.states, index: 0 },
				to: { parent: g.states, index: 1 }
			});
		});
	});

	describe('Column#move', () => {
		it('不绑定 v-model:columns 也生效，并经 update:columns 发出新顺序；隐藏列在兄弟列中的位置不变', async () => {
			const onUpdate = vi.fn();
			const { vm } = await mountTable({ 'onUpdate:columns': onUpdate });
			const { drag, column } = vm.store;

			// 隐藏 D：顶层 [selection, A, G, D(隐藏), E]，把 A 移到 G 之后
			find(vm, 'D').states.hidden = true;
			vm.store.updateColumns();
			await flush();
			const result = column.move(drag.getColumnMove(find(vm, 'A'), find(vm, 'G'), 'after'));
			await flush();
			expect(level(vm)).toEqual(['selection', 'G', 'A', 'D', 'E']);
			expect(leaves(vm)).toEqual(['selection', 'B', 'C', 'A', 'E']);
			expect(result.map((item: any) => item.label || item.type)).toEqual(['selection', 'B', 'C', 'A', 'D', 'E']);
			expect(onUpdate).toHaveBeenLastCalledWith(result);
		});

		it('发出后不写回（只监听 update:columns）：之后的外部修改照常生效', async () => {
			const columns = ref<any[]>([]);
			const onUpdate = vi.fn();
			const { vm } = await mountTable(() => ({ 'columns': columns.value, 'onUpdate:columns': onUpdate }));
			const template = onUpdate.mock.calls.at(-1)![0];
			const { drag, column } = vm.store;

			column.move(drag.getColumnMove(find(vm, 'A'), find(vm, 'D'), 'after'));
			await flush();
			expect(leaves(vm)).toEqual(['selection', 'B', 'C', 'D', 'A', 'E']);

			// 外部恢复为模板顺序（与当前列不同）
			columns.value = template;
			await flush();
			await sleep(30);
			await flush();
			expect(leaves(vm)).toEqual(['selection', 'A', 'B', 'C', 'D', 'E']);
		});

		it('绑定 v-model:columns：写回为回流，顺序保持；之后外部写回其他顺序仍以外部为准', async () => {
			const columns = ref<any[]>([]);
			const { vm } = await mountTable(() => vModel(columns));
			const { drag, column } = vm.store;

			column.move(drag.getColumnMove(find(vm, 'B'), find(vm, 'C'), 'after'));
			await flush();
			await sleep(30);
			await flush();
			expect(leaves(vm)).toEqual(['selection', 'A', 'C', 'B', 'D', 'E']);
			expect(columns.value.map((item: any) => item.label || item.type)).toEqual(['selection', 'A', 'C', 'B', 'D', 'E']);

			columns.value = [...columns.value].reverse();
			await flush();
			await sleep(30);
			await flush();
			// E 右固定，仍在末尾
			expect(leaves(vm)).toEqual(['D', 'B', 'C', 'A', 'selection', 'E']);
		});
	});

	describe('交互', () => {
		// jsdom 没有排版：按列在可见叶子列中的下标模拟横向布局（每列 COL 宽，表头每行 ROW 高），表体可见宽度 BODY_WIDTH
		const COL = 100;
		const ROW = 40;
		const BODY_WIDTH = 600;
		let layoutVm: any = null;
		let restoreLayout: any;
		// 表头的纵向偏移（模拟页面纵向滚动、表头吸顶）
		let headerShift = 0;

		const toRect = (left: number, top: number, width: number, height: number) => ({
			left, top, width, height, right: left + width, bottom: top + height, x: left, y: top, toJSON: () => ({})
		}) as DOMRect;

		beforeEach(() => {
			restoreLayout = vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
				const el = this as HTMLElement;
				const vm = layoutVm;
				if (!vm) return toRect(0, 0, 0, 0);
				const body = vm.$el.querySelector('.vc-table__body-wrapper') as HTMLElement;
				const scroll = body?.scrollLeft || 0;
				const { columns, headerRows } = vm.store.states;
				const headerHeight = headerRows.length * ROW;
				if (el === body) return toRect(0, headerHeight, BODY_WIDTH, 200);
				if (el.classList.contains('vc-table__th')) {
					const node = flattenColumnNodes(vm.store.states._columns).concat(vm.store.states._columns)
						.concat(...vm.store.states._columns.map((item: any) => item.childNodes))
						.find((item: any) => el.classList.contains(item.states.id));
					if (!node) return toRect(0, 0, 0, 0);
					const indices = flattenColumnNodes([node]).map((leaf: any) => columns.indexOf(leaf)).filter((i: number) => i >= 0);
					const left = Math.min(...indices) * COL - scroll;
					const top = (node.childNodes.length ? 0 : ((node.states.level || 1) - 1) * ROW) + headerShift;
					return toRect(left, top, indices.length * COL, node.childNodes.length ? ROW : headerHeight - top);
				}
				if (el.classList.contains('vc-table__td') && el.dataset.column != null) {
					return toRect(Number(el.dataset.column) * COL - scroll, headerHeight + Number(el.dataset.row) * ROW, COL, ROW);
				}
				return toRect(0, 0, 0, 0);
			});
		});

		afterEach(() => {
			restoreLayout.mockRestore();
			layoutVm = null;
			headerShift = 0;
		});

		// 临时定义元素的只读属性
		const defineProps = (el: Element, values: Record<string, number>) => {
			Object.entries(values).forEach(([key, value]) => {
				Object.defineProperty(el, key, { configurable: true, get: () => value });
			});
		};

		const mountLayout = async (props: Record<string, any> | (() => Record<string, any>) = {}) => {
			const result = await mountTable(props);
			layoutVm = result.vm;
			defineProps(result.wrapper.find('.vc-table__body-wrapper').element, { clientWidth: BODY_WIDTH });
			return result;
		};

		// 列的表头单元格（按名称）与它的横向中心
		const thOf = (wrapper: any, name: string) => wrapper.findAll('.vc-table__thead .vc-table__th')
			.find((th: any) => th.find('.vc-table__th-label').exists() && th.find('.vc-table__th-label').text() === name).element as HTMLElement;
		const centerOf = (vm: any, name: string) => {
			const indices = flattenColumnNodes([find(vm, name)]).map((leaf: any) => vm.store.states.columns.indexOf(leaf));
			return (Math.min(...indices) + indices.length / 2) * COL;
		};

		const press = (el: Element, clientX: number, clientY = 10) => {
			el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 0, buttons: 1, clientX, clientY }));
		};
		const moveTo = async (clientX: number, clientY = 10) => {
			window.dispatchEvent(new MouseEvent('mousemove', { cancelable: true, buttons: 1, clientX, clientY }));
			await sleep(30);
		};
		const release = () => window.dispatchEvent(new MouseEvent('mouseup', {}));

		// 从列 name 的表头中心按下，越过阈值后移到横坐标 toX（不松手）
		const startDrag = async (wrapper: any, vm: any, name: string, toX: number) => {
			const x = centerOf(vm, name);
			press(thOf(wrapper, name), x);
			await moveTo(x + 10);
			await moveTo(toX);
		};
		const indicatorOf = (wrapper: any) => wrapper.element.querySelector('.vc-table__drop-indicator') as HTMLElement;

		it('拖动表头：插入线标出落点，松手后顺序生效；事件依次为 dragstart / update:columns / drop / dragend', async () => {
			const events: string[] = [];
			const onStart = vi.fn(() => events.push('start'));
			const onUpdate = vi.fn(() => events.push('update'));
			const onDrop = vi.fn(() => events.push('drop'));
			const onEnd = vi.fn(() => events.push('end'));
			const { wrapper, vm } = await mountLayout({
				'onColumnDragstart': onStart,
				'onColumnDrop': onDrop,
				'onColumnDragend': onEnd,
				'onUpdate:columns': onUpdate
			});
			onUpdate.mockClear();
			events.length = 0;
			expect(thOf(wrapper, 'A').classList.contains('is-column-draggable')).toBe(true);
			expect(wrapper.find('.vc-table__thead .vc-table__selection-column').classes()).not.toContain('is-column-draggable');

			// A（下标 1）拖到 D（下标 4）的右半边
			await startDrag(wrapper, vm, 'A', 480);
			expect(onStart).toHaveBeenCalledWith({ column: find(vm, 'A').states, columnIndex: 1 });
			const indicator = indicatorOf(wrapper);
			expect(indicator.classList.contains('is-vertical')).toBe(true);
			expect(indicator.style.display).toBe('');
			expect(indicator.style.left).toBe('500px');
			expect(document.body.classList.contains('vc-table-dragging')).toBe(true);
			expect(wrapper.element.classList.contains('is-column-dragging')).toBe(true);
			// 被拖列变暗：表头按 id、表体按 data-column
			const style = wrapper.element.querySelector('style')!.textContent!;
			expect(style).toContain(`.vc-table__header-wrapper .vc-table__th.${find(vm, 'A').states.id}`);
			expect(style).toContain('.vc-table__td[data-column="1"]');
			// 跟随块为表头单元格的克隆，不在表头内，不受变暗样式影响
			const ghost = wrapper.element.querySelector('.vc-table__drag-ghost.is-column') as HTMLElement;
			expect(ghost.textContent).toContain('A');
			expect(ghost.closest('.vc-table__header-wrapper')).toBeNull();

			release();
			await flush();
			expect(events).toEqual(['start', 'update', 'drop', 'end']);
			expect(leaves(vm)).toEqual(['selection', 'B', 'C', 'D', 'A', 'E']);
			expect(onDrop).toHaveBeenCalledWith({
				column: find(vm, 'A').states,
				targetColumn: find(vm, 'D').states,
				position: 'after',
				from: { parent: null, index: 1 },
				to: { parent: null, index: 3 },
				columns: (onUpdate.mock.calls[0] as any[])[0]
			});
			expect(onEnd).toHaveBeenCalledWith({ column: find(vm, 'A').states, columnIndex: 1, dropped: true });
			// 清理
			expect(wrapper.element.querySelector('.vc-table__drop-indicator')).toBeNull();
			expect(wrapper.element.querySelector('.vc-table__drag-ghost')).toBeNull();
			expect(wrapper.element.querySelector('style')).toBeNull();
			expect(wrapper.element.classList.contains('is-column-dragging')).toBe(false);
			expect(document.body.classList.contains('vc-table-dragging')).toBe(false);
			expect(vm.store.states.dragging).toBe(false);
		});

		it('阈值内的移动视为点击，触发 header-click；拖拽松手后的 click 被吞掉', async () => {
			const onClick = vi.fn();
			const onStart = vi.fn();
			const { wrapper, vm } = await mountLayout({ onHeaderClick: onClick, onColumnDragstart: onStart });
			const th = thOf(wrapper, 'D');

			press(th, 450);
			await moveTo(452);
			release();
			th.click();
			expect(onStart).not.toHaveBeenCalled();
			expect(onClick).toHaveBeenCalledTimes(1);

			await startDrag(wrapper, vm, 'D', 150);
			release();
			th.click();
			await flush();
			expect(onStart).toHaveBeenCalledTimes(1);
			expect(onClick).toHaveBeenCalledTimes(1);
		});

		it('不发起：排序图标、列宽拖拽区（border 时表头右缘 8px 内）、结构列、draggable 第二项为 false', async () => {
			const onStart = vi.fn();
			const draggable = ref<any>([false, true]);
			const { wrapper, vm } = await mountLayout(() => ({ border: true, draggable: draggable.value, onColumnDragstart: onStart }));

			// 排序图标
			const sort = thOf(wrapper, 'A').querySelector('.vc-table-sort')!;
			press(sort, 150);
			await moveTo(300);
			release();
			// 列宽拖拽区：D 的右缘为 500。表头在 mousemove 时认出拖拽区，按下后开始调整列宽，此时不发起列拖拽
			const d = thOf(wrapper, 'D');
			d.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: 496, clientY: 10 }));
			press(d, 496);
			await moveTo(300);
			release();
			document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
			// 结构列
			press(wrapper.find('.vc-table__thead .vc-table__selection-column').element, 50);
			await moveTo(300);
			release();
			await flush();
			expect(onStart).not.toHaveBeenCalled();

			// 列宽拖拽区之外可以发起
			await startDrag(wrapper, vm, 'D', 150);
			release();
			await flush();
			expect(onStart).toHaveBeenCalledTimes(1);

			draggable.value = true;
			await flush();
			expect(thOf(wrapper, 'D').classList.contains('is-column-draggable')).toBe(false);
			await startDrag(wrapper, vm, 'D', 150);
			release();
			await flush();
			expect(onStart).toHaveBeenCalledTimes(1);
		});

		it('落点只在同一父级、同一固定分组：指针停在右固定列上时取最近的候选列；分组内的列只在分组内移动', async () => {
			const { wrapper, vm } = await mountLayout();

			// D 拖到右固定列 E 上：最近的候选为 D 自身，顺序不变，不显示插入线
			await startDrag(wrapper, vm, 'D', 550);
			expect(indicatorOf(wrapper).style.display).toBe('none');
			release();
			await flush();
			expect(leaves(vm)).toEqual(['selection', 'A', 'B', 'C', 'D', 'E']);

			// A 拖到右固定列 E 上：E 不是候选，取最近的 D，落在 D 之后
			await startDrag(wrapper, vm, 'A', 520);
			expect(indicatorOf(wrapper).style.display).toBe('');
			expect(indicatorOf(wrapper).style.left).toBe('500px');
			release();
			await flush();
			expect(leaves(vm)).toEqual(['selection', 'B', 'C', 'D', 'A', 'E']);

			// A 拖到结构列 selection 上：取最近的 G，落在 G 之前
			await startDrag(wrapper, vm, 'A', 40);
			expect(indicatorOf(wrapper).style.left).toBe('100px');
			release();
			await flush();
			expect(leaves(vm)).toEqual(['selection', 'A', 'B', 'C', 'D', 'E']);

			// B 拖到 D 上：候选只有 B、C，落在 C 之后
			await startDrag(wrapper, vm, 'B', 450);
			expect(indicatorOf(wrapper).style.left).toBe('400px');
			release();
			await flush();
			expect(leaves(vm)).toEqual(['selection', 'A', 'C', 'B', 'D', 'E']);
			expect(level(vm, find(vm, 'G'))).toEqual(['C', 'B']);
		});

		it('分组表头连同子列一起移动', async () => {
			const { wrapper, vm } = await mountLayout();
			// G（下标 2、3）拖到 A（下标 1）的左半边
			await startDrag(wrapper, vm, 'G', 120);
			expect(indicatorOf(wrapper).style.left).toBe('100px');
			release();
			await flush();
			expect(level(vm)).toEqual(['selection', 'G', 'A', 'D', 'E']);
			expect(leaves(vm)).toEqual(['selection', 'B', 'C', 'A', 'D', 'E']);
		});

		it('allowDrag 为 false 不可拖；allowDrop 为 false 时插入线为错误色，松手不生效', async () => {
			const onEnd = vi.fn();
			const onStart = vi.fn();
			const { wrapper, vm } = await mountLayout({
				allowDrag: ({ type, column }: any) => type !== 'column' || column.label !== 'D',
				allowDrop: ({ targetColumn }: any) => targetColumn.label !== 'G',
				onColumnDragstart: onStart,
				onColumnDragend: onEnd
			});
			expect(thOf(wrapper, 'D').classList.contains('is-column-draggable')).toBe(false);
			press(thOf(wrapper, 'D'), 450);
			await moveTo(150);
			release();
			expect(onStart).not.toHaveBeenCalled();

			await startDrag(wrapper, vm, 'A', 320);
			expect(indicatorOf(wrapper).classList.contains('is-disabled')).toBe(true);
			release();
			await flush();
			expect(onEnd).toHaveBeenLastCalledWith(expect.objectContaining({ dropped: false }));
			expect(leaves(vm)).toEqual(['selection', 'A', 'B', 'C', 'D', 'E']);
		});

		it('绑定 v-model:columns：松手后外部数组同步为新顺序', async () => {
			const columns = ref<any[]>([]);
			const { wrapper, vm } = await mountLayout(() => vModel(columns));
			await startDrag(wrapper, vm, 'D', 120);
			release();
			await flush();
			await sleep(30);
			await flush();
			expect(columns.value.map((item: any) => item.label || item.type)).toEqual(['selection', 'D', 'A', 'B', 'C', 'E']);
			expect(leaves(vm)).toEqual(['selection', 'D', 'A', 'B', 'C', 'E']);
		});

		it('Esc 取消；拖拽中列变化（隐藏列）取消', async () => {
			const onEnd = vi.fn();
			const columns = ref<any[]>([]);
			const { wrapper, vm } = await mountLayout(() => ({ ...vModel(columns), onColumnDragend: onEnd }));

			await startDrag(wrapper, vm, 'A', 480);
			window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
			await flush();
			expect(onEnd).toHaveBeenLastCalledWith(expect.objectContaining({ dropped: false }));
			expect(wrapper.element.querySelector('.vc-table__drag-ghost')).toBeNull();

			await startDrag(wrapper, vm, 'A', 480);
			columns.value = columns.value.map((item: any) => (item.label === 'D' ? { ...item, hidden: true } : item));
			await flush();
			await sleep(30);
			await flush();
			expect(onEnd).toHaveBeenCalledTimes(2);
			expect(onEnd).toHaveBeenLastCalledWith(expect.objectContaining({ dropped: false }));
			release();
			await flush();
			expect(leaves(vm)).toEqual(['selection', 'A', 'B', 'C', 'E']);
		});

		it('自动滚动：非固定列靠近滚动区域右缘时横向滚动表体', async () => {
			const { wrapper, vm } = await mountLayout();
			const body = wrapper.find('.vc-table__body-wrapper').element as HTMLElement;
			defineProps(body, { scrollWidth: 1200, clientWidth: BODY_WIDTH });
			// 右固定列 E 的左缘为 500，滚动区域为 [0, 500]
			await startDrag(wrapper, vm, 'A', 495);
			await sleep(100);
			expect(body.scrollLeft).toBeGreaterThan(0);
			release();
			await flush();
		});

		it('触摸：表头长按后拖动；长按前移动视为滚动', async () => {
			const onStart = vi.fn();
			const { wrapper, vm } = await mountLayout({ onColumnDragstart: onStart });
			const fire = (el: EventTarget, type: string, clientX: number) => {
				const e = new Event(type, { bubbles: true, cancelable: true }) as any;
				const touches = [{ clientX, clientY: 10 }];
				e.touches = type === 'touchend' ? [] : touches;
				e.changedTouches = touches;
				el.dispatchEvent(e);
			};
			const th = thOf(wrapper, 'A');

			// 长按前移动：放弃
			fire(th, 'touchstart', 150);
			fire(window, 'touchmove', 170);
			await sleep(350);
			fire(window, 'touchend', 170);
			expect(onStart).not.toHaveBeenCalled();

			fire(th, 'touchstart', 150);
			await sleep(350);
			expect(onStart).toHaveBeenCalledTimes(1);
			fire(window, 'touchmove', 480);
			await sleep(30);
			fire(window, 'touchend', 480);
			await flush();
			expect(leaves(vm)).toEqual(['selection', 'B', 'C', 'D', 'A', 'E']);
		});

		it('column-dragstart 的监听器里同步卸载表格：清理跟随块、插入线、变暗样式与 body 类名', async () => {
			// 监听器里要用到挂载结果，先占位
			const mounted: { wrapper?: any } = {};
			const result = await mountLayout({ onColumnDragstart: () => mounted.wrapper.unmount() });
			mounted.wrapper = result.wrapper;
			const root = result.wrapper.element as HTMLElement;
			await startDrag(result.wrapper, result.vm, 'A', 480);
			expect(root.querySelector('.vc-table__drag-ghost')).toBeNull();
			expect(root.querySelector('.vc-table__drop-indicator')).toBeNull();
			expect(root.querySelector('style')).toBeNull();
			expect(document.body.classList.contains('vc-table-dragging')).toBe(false);
			expect(result.vm.store.states.dragging).toBe(false);
		});

		it('跟随块纵向与被拖列的表头单元格对齐（页面纵向滚动、表头吸顶时随之移动）', async () => {
			const { wrapper, vm } = await mountLayout();
			await startDrag(wrapper, vm, 'A', 300);
			const ghost = wrapper.element.querySelector('.vc-table__drag-ghost') as HTMLElement;
			expect(ghost.style.top).toBe('0px');

			headerShift = 50;
			window.dispatchEvent(new Event('scroll'));
			await sleep(30);
			expect(ghost.style.top).toBe('50px');
			release();
			await flush();
		});

		it('变暗样式包含合计行单元格与跨过被拖列的横向合并格', async () => {
			// 第 0 行：A（下标 1）与 B（下标 2）横向合并
			const getSpan = ({ rowIndex, columnIndex }: any) => (rowIndex === 0 && columnIndex === 1 ? [1, 2] : [1, 1]);
			const { wrapper, vm } = await mountLayout({ showSummary: true, getSpan });
			const footerCell = Array.from(wrapper.element.querySelectorAll('.vc-table__td[data-column="2"]'))
				.find(el => !(el as HTMLElement).closest('.vc-table__body-wrapper'));
			expect(footerCell).toBeTruthy();

			// 拖 B（分组内，下标 2）
			await startDrag(wrapper, vm, 'B', 400);
			const style = wrapper.element.querySelector('style')!.textContent!;
			expect(style).toContain('.vc-table__td[data-column="2"]');
			expect(style).toContain('.vc-table__td[data-column="1"][aria-colspan="2"]');
			release();
			await flush();
		});

		it('[true, true]：表体按下拖行，表头按下拖列，互不干扰', async () => {
			const onBlockStart = vi.fn();
			const onColumnStart = vi.fn();
			const { wrapper, vm } = await mountLayout({ draggable: [true, true], onBlockDragstart: onBlockStart, onColumnDragstart: onColumnStart });

			await startDrag(wrapper, vm, 'A', 480);
			release();
			await flush();
			expect(onColumnStart).toHaveBeenCalledTimes(1);
			expect(onBlockStart).not.toHaveBeenCalled();

			const td = wrapper.find('.vc-table__body-wrapper .vc-table__td[data-row="0"][data-column="1"]').element;
			td.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 0, buttons: 1, clientX: 150, clientY: 100 }));
			await moveTo(150, 130);
			release();
			await flush();
			expect(onBlockStart).toHaveBeenCalledTimes(1);
			expect(onColumnStart).toHaveBeenCalledTimes(1);
		});
	});
});
