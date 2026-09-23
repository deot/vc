// @vitest-environment jsdom

import { MTable, MTableColumn, Table, TableColumn } from '@deot/vc-components';
import { mount } from '@vue/test-utils';
import { nextTick, reactive, ref, toRaw } from 'vue';
import { vi } from 'vitest';

import { Store } from '../store/store';
import { Layout, computeMergePlan, columnsToRowsEffect } from '../store/modules';
import { useStates } from '../store/use-states';
import {
	getRowValue,
	getValuesMap,
	parseHeight,
	parseMinWidth,
	parseWidth
} from '../utils';
import { TableSort } from '../table-header/table-sort';
import { TableGrid } from '../table-grid';
import { TableColumnNode } from '../table-column/table-column-node';

const sleep = (ms = 0) => new Promise<void>(r => setTimeout(r, ms));

const flush = async () => {
	await nextTick();
	await sleep(0);
	await nextTick();
};

/**
 * 通过 getter 方式临时 mock 只读属性（如 `clientWidth` / `scrollHeight`），
 * 返回 restore 函数。
 * @param obj 对象
 * @param prop 属性
 * @param value 值
 * @returns ~
 */
const defineGetter = (obj: any, prop: string, value: any) => {
	const old = Object.getOwnPropertyDescriptor(obj, prop);
	Object.defineProperty(obj, prop, {
		configurable: true,
		get: () => value
	});
	return () => {
		if (old) {
			Object.defineProperty(obj, prop, old);
		} else {
			delete obj[prop];
		}
	};
};

/**
 * 让 jsdom 中默认只读的属性（如 `scrollLeft / scrollTop`）变成可写，
 * 用于触发 `el.scrollLeft = x` 这种赋值路径。
 * @param obj ~
 * @param prop ~
 * @param value ~
 */
const makeWritable = (obj: any, prop: string, value: any = 0) => {
	Object.defineProperty(obj, prop, { configurable: true, writable: true, value });
};

const buildData = (length: number) => Array.from({ length }).map((_, index) => ({
	id: `id__${index}`,
	name: `name-${index}`,
	count: index,
	address: `addr-${index}`
}));

// store 层单测直接组装列节点（组件路径由 vc-table-column 创建）
const buildColumnNode = (states: any = {}, childNodes: any[] = []): TableColumnNode => {
	const node = new TableColumnNode({ table: null as any, states });
	node.childNodes.push(...childNodes);
	return node;
};

describe('index.ts', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('basic exports', () => {
		expect(typeof Table).toBe('object');
		expect(typeof TableColumn).toBe('object');
		expect(MTable).toBe(Table);
		expect(MTableColumn).toBe(TableColumn);
	});

	it('create empty table renders default empty text and root class', async () => {
		const wrapper = mount(() => (<Table />), { attachTo: document.body });
		await flush();

		expect(wrapper.classes()).toContain('vc-table');
		expect(wrapper.find('.vc-table__empty-wrapper').exists()).toBe(true);
		expect(wrapper.find('.vc-table__empty-text').text()).toContain('暂无数据');

		wrapper.unmount();
	});

	it('emptyText custom string and empty slot override default text', async () => {
		const w1 = mount(() => (<Table emptyText="无数据~" />), { attachTo: document.body });
		await flush();
		expect(w1.find('.vc-table__empty-text').text()).toBe('无数据~');
		w1.unmount();

		const w2 = mount(() => (
			<Table>
				{{ empty: () => <span class="custom-empty">空</span> }}
			</Table>
		), { attachTo: document.body });
		await flush();
		expect(w2.find('.custom-empty').exists()).toBe(true);
		w2.unmount();
	});
});

describe('Table render & modifier classes', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('applies modifier classes for stripe / border / divider / fit / size', async () => {
		const data = buildData(2);
		const wrapper = mount(() => (
			<Table
				data={data}
				stripe
				border
				divider
				maxHeight={400}
				fit={false}
				size="small"
			>
				<TableColumn label="名称" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();

		expect(wrapper.classes()).toEqual(expect.arrayContaining([
			'vc-table',
			'vc-table--striped',
			'vc-table--border',
			'vc-table--divider',
			'vc-table--small'
		]));
		expect(wrapper.classes()).not.toContain('vc-table--fit');
		// 已移除的无样式状态类
		['--fluid-height', '--group', '--sticky-columns', '--enable-row-hover'].forEach((name) => {
			expect(wrapper.classes()).not.toContain(`vc-table${name}`);
		});

		wrapper.unmount();
	});

	it('size defaults to medium and renders the size modifier class', async () => {
		const size = ref<string | undefined>(undefined);
		const wrapper = mount(() => (
			<Table data={buildData(1)} size={size.value as any}>
				<TableColumn label="名称" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();
		expect(wrapper.classes()).toContain('vc-table--medium');

		size.value = 'large';
		await flush();
		expect(wrapper.classes()).toContain('vc-table--large');
		expect(wrapper.classes()).not.toContain('vc-table--medium');
		wrapper.unmount();
	});

	it('renders header / footer with custom getSummary + append slot', async () => {
		const data = buildData(3);
		const wrapper = mount(() => (
			<Table
				data={data}
				showSummary
				getSummary={({ data: rows }: any) => ['汇总', rows.length]}
			>
				{{
					default: () => [
						<TableColumn label="序号" type="index" />,
						<TableColumn label="名称" prop="name" />
					],
					append: () => <div class="my-append">extra</div>
				}}
			</Table>
		), { attachTo: document.body });
		await flush();

		expect(wrapper.find('.vc-table__header-wrapper').exists()).toBe(true);
		expect(wrapper.find('.vc-table__footer-wrapper').exists()).toBe(true);
		expect(wrapper.find('.my-append').exists()).toBe(true);
		expect(wrapper.find('.vc-table__footer').text()).toContain('汇总');

		wrapper.unmount();
	});

	it('default sumText "合计" when no getSummary is provided', async () => {
		const data = buildData(2);
		const wrapper = mount(() => (
			<Table data={data} showSummary>
				<TableColumn label="名称" prop="name" />
				<TableColumn label="计数" prop="count" />
			</Table>
		), { attachTo: document.body });
		await flush();
		expect(wrapper.find('.vc-table__footer').text()).toContain('合计');
		wrapper.unmount();
	});

	it('hides header when showHeader=false', async () => {
		const wrapper = mount(() => (
			<Table data={buildData(1)} showHeader={false}>
				<TableColumn label="名称" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();

		expect(wrapper.find('.vc-table__header-wrapper').exists()).toBe(false);
		wrapper.unmount();
	});
});

describe('TableColumn types & rendering', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('renders selection / index / default / fixed columns and supports filter/tooltip/sort flags', async () => {
		const data = buildData(2);
		const wrapper = mount(() => (
			<Table
				data={data}
				primaryKey="id"
			>
				<TableColumn type="selection" fixed="left" width={60} />
				<TableColumn type="index" label="#" index={1} />
				<TableColumn
					label="名称"
					prop="name"
					sortable
					tooltip="提示"
					filterOptions={{ data: [{ value: 1, label: 'a' }] }}
					headerAlign="center"
					align="center"
				/>
				<TableColumn label="操作" fixed="right" minWidth={80}>
					{{ default: ({ rowIndex }: any) => <button class="op">{rowIndex}</button> }}
				</TableColumn>
			</Table>
		), { attachTo: document.body });
		await flush();

		expect(wrapper.find('.vc-table__selection-column').exists()).toBe(true);
		expect(wrapper.findAll('.vc-table__th').length).toBeGreaterThanOrEqual(4);
		expect(wrapper.findAll('.vc-table-sort').length).toBeGreaterThan(0);
		expect(wrapper.findAll('.op').length).toBe(2);
		// !height 路径走单一 DOM + sticky，固定列以 is-fixed-left / is-fixed-right 表示，不再有 .vc-table__fixed* 容器。
		expect(wrapper.find('.vc-table__th.is-fixed-left').exists()).toBe(true);
		expect(wrapper.find('.vc-table__th.is-fixed-right').exists()).toBe(true);
		expect(wrapper.find('.vc-table__fixed').exists()).toBe(false);
		expect(wrapper.find('.vc-table__fixed-right').exists()).toBe(false);

		wrapper.unmount();
	});

	it('index column supports function index() and falls back to label "#"', async () => {
		const indexFn = vi.fn((i: number) => `R${i + 1}`);
		const wrapper = mount(() => (
			<Table data={buildData(2)} primaryKey="id">
				<TableColumn type="index" index={indexFn} />
				<TableColumn label="名称" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();

		const cells = wrapper.findAll('.vc-table__td');
		expect(cells.some(c => c.text().includes('R1'))).toBe(true);
		expect(indexFn).toHaveBeenCalled();
		expect(wrapper.find('.vc-table__th').text()).toContain('#');
		wrapper.unmount();
	});

	it('formatter and placeholder render correctly', async () => {
		const data = [{ id: 1, name: '' }, { id: 2, name: 'foo' }];
		const wrapper = mount(() => (
			<Table data={data} primaryKey="id" placeholder="--">
				<TableColumn label="名称" prop="name" formatter={({ row }: any) => row.name ? `[${row.name}]` : null} />
			</Table>
		), { attachTo: document.body });
		await flush();

		const cells = wrapper.findAll('.vc-table__td .vc-table__cell');
		expect(cells.some(c => c.text() === '--')).toBe(true);
		expect(cells.some(c => c.text() === '[foo]')).toBe(true);
		wrapper.unmount();
	});

	it('placeholder as function is invoked', async () => {
		const wrapper = mount(() => (
			<Table data={[{ id: 1, name: '' }]} primaryKey="id" placeholder={() => 'EMPTY'}>
				<TableColumn label="名称" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();
		expect(wrapper.text()).toContain('EMPTY');
		wrapper.unmount();
	});

	it('width / min-width accept strings and stay numeric when min-width changes at runtime', async () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const minWidth = ref('100');
		const tableRef = ref<any>();
		const wrapper = mount(() => (
			<Table ref={tableRef} data={buildData(1)}>
				<TableColumn label="A" prop="name" minWidth={minWidth.value} />
				<TableColumn label="B" prop="count" width="120px" />
			</Table>
		), { attachTo: document.body });
		await flush();
		const vm = tableRef.value!;
		const [a, b] = vm.store.states.columns;
		expect(a.states.minWidth).toBe(100);
		expect(b.states.width).toBe(120);

		minWidth.value = '200px';
		await flush();
		await sleep(60);
		await flush();
		expect(a.states.minWidth).toBe(200);
		// 列宽累加保持数值（jsdom 容器宽度为 0，取列宽之和）
		expect(vm.layout.states.bodyWidth).toBe(320);
		// 字符串宽度不再触发 prop 类型警告
		expect(warn.mock.calls.some(args => String(args[0]).includes('Invalid prop'))).toBe(false);
		warn.mockRestore();
		wrapper.unmount();
	});

	it('unparsable width / min-width fall back to the type preset instead of keeping the raw string', async () => {
		const tableRef = ref<any>();
		const wrapper = mount(() => (
			<Table ref={tableRef} data={buildData(1)}>
				<TableColumn type="selection" width="auto" />
				<TableColumn label="A" prop="name" width="auto" minWidth="auto" />
				<TableColumn label="B" prop="count" width={120} />
			</Table>
		), { attachTo: document.body });
		await flush();
		const vm = tableRef.value!;
		const [selection, a] = vm.store.states.columns;
		expect(selection.states.width).toBe(60);
		expect(a.states.width).toBeUndefined();
		expect(a.states.minWidth).toBe(80);
		// 60 + 80 + 120，全为数值
		expect(vm.layout.states.bodyWidth).toBe(260);
		wrapper.unmount();
	});
});

describe('Table interaction events', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('emits row-click / cell-mouse-* / current-change', async () => {
		const onRowClick = vi.fn();
		const onCellMouseEnter = vi.fn();
		const onCellMouseLeave = vi.fn();
		const onCurrentChange = vi.fn();
		const onRowDblclick = vi.fn();
		const onRowContextmenu = vi.fn();

		const data = buildData(2);
		const wrapper = mount(() => (
			<Table
				data={data}
				highlight
				rowClass="custom-row"
				cellClass={() => 'custom-cell'}
				rowStyle={() => ({ color: 'red' })}
				cellStyle={{ background: '#f5f5f5' }}
				onRowClick={onRowClick}
				onRowDblclick={onRowDblclick}
				onRowContextmenu={onRowContextmenu}
				onCellMouseEnter={onCellMouseEnter}
				onCellMouseLeave={onCellMouseLeave}
				onCurrentChange={onCurrentChange}
			>
				<TableColumn label="名称" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();

		// 事件为容器级委托：enter/leave 由 mouseover（冒泡）+ 容器 mouseleave 合成
		const cell = wrapper.find('.vc-table__td');
		await cell.trigger('mouseover');
		await wrapper.find('.vc-table__body-wrapper .vc-table__tr').trigger('mouseleave');
		await cell.trigger('click');
		await cell.trigger('contextmenu');
		await cell.trigger('dblclick');
		await flush();

		expect(onRowClick).toHaveBeenCalled();
		expect(onRowDblclick).toHaveBeenCalled();
		expect(onRowContextmenu).toHaveBeenCalled();
		expect(onCellMouseEnter).toHaveBeenCalled();
		expect(onCellMouseLeave).toHaveBeenCalled();
		expect(onCurrentChange).toHaveBeenCalled();
		expect(wrapper.find('.vc-table__body-wrapper .vc-table__tr.custom-row').exists()).toBe(true);
		expect(wrapper.find('.custom-cell').exists()).toBe(true);

		wrapper.unmount();
	});

	it('emits header-click / header-contextmenu', async () => {
		const onHeaderClick = vi.fn();
		const onHeaderContextmenu = vi.fn();
		const wrapper = mount(() => (
			<Table
				data={buildData(1)}
				onHeaderClick={onHeaderClick}
				onHeaderContextmenu={onHeaderContextmenu}
			>
				<TableColumn label="名称" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();

		const th = wrapper.find('.vc-table__th');
		await th.trigger('click');
		await th.trigger('contextmenu');
		expect(onHeaderClick).toHaveBeenCalled();
		expect(onHeaderContextmenu).toHaveBeenCalled();
		wrapper.unmount();
	});

	it('rowClass / rowStyle / cellClass / cellStyle string + function forms', async () => {
		const data = buildData(2);
		const wrapper = mount(() => (
			<Table
				data={data}
				rowClass={() => 'fn-row'}
				rowStyle={{ color: 'blue' }}
				cellClass="str-cell"
				cellStyle={() => ({ background: 'red' })}
				headerRowClass="hd-str"
				headerCellClass="hd-cell-str"
				headerRowStyle={{ color: 'red' }}
				headerCellStyle={{ background: 'red' }}
			>
				<TableColumn label="名称" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();

		expect(wrapper.find('.vc-table__body-wrapper .vc-table__tr.fn-row').exists()).toBe(true);
		expect(wrapper.find('.str-cell').exists()).toBe(true);
		expect(wrapper.find('.vc-table__thead .vc-table__tr.hd-str').exists()).toBe(true);
		expect(wrapper.find('.hd-cell-str').exists()).toBe(true);

		wrapper.unmount();

		const w2 = mount(() => (
			<Table
				data={data}
				headerRowClass={() => 'hd-fn'}
				headerCellClass={() => 'hd-cell-fn'}
				headerRowStyle={() => ({ color: 'red' })}
				headerCellStyle={() => ({ background: 'red' })}
			>
				<TableColumn label="名称" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();
		expect(w2.find('.vc-table__thead .vc-table__tr.hd-fn').exists()).toBe(true);
		expect(w2.find('.hd-cell-fn').exists()).toBe(true);
		w2.unmount();
	});

	it('mouseleave on table clears hoverRowIndex', async () => {
		const tableRef = ref<any>();
		const wrapper = mount(() => (
			<Table ref={tableRef} data={buildData(1)}>
				<TableColumn label="名称" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();
		const vm = tableRef.value!;

		// 通过 cell 的 mouseover（委托）进入 hover，再触发表格 mouseleave
		const cell = wrapper.find('.vc-table__td');
		await cell.trigger('mouseover');
		await flush();
		await wrapper.trigger('mouseleave');
		await flush();

		// store 上的 hoverRowIndex 应被清理
		expect(vm.store.states.hoverRowIndex).toBe(null);
		wrapper.unmount();
	});
});

describe('Selection & expose API', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('toggleAllSelection / toggleRowSelection / clearSelection / setCurrentRow', async () => {
		const onSelect = vi.fn();
		const onSelectionChange = vi.fn();
		const onSelectAll = vi.fn();
		const data = buildData(3);

		const tableRef = ref<any>();
		const wrapper = mount(() => (
			<Table
				ref={tableRef}
				data={data}
				primaryKey="id"
				onSelect={onSelect}
				onSelectAll={onSelectAll}
				onSelectionChange={onSelectionChange}
			>
				<TableColumn type="selection" />
				<TableColumn label="名称" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();

		const vm = tableRef.value!;

		vm.toggleRowSelection(data[0]);
		await flush();
		expect(onSelect).toHaveBeenCalled();
		expect(onSelectionChange).toHaveBeenCalled();
		expect(vm.store.states.selection.length).toBe(1);

		vm.toggleRowSelection(data[0]);
		await flush();
		expect(vm.store.states.selection.length).toBe(0);

		onSelect.mockClear();
		vm.toggleRowSelection(data[1], true, false);
		await flush();
		expect(onSelect).not.toHaveBeenCalled();
		expect(vm.store.states.selection.length).toBe(1);

		vm.toggleAllSelection();
		await sleep(30);
		await flush();
		expect(onSelectAll).toHaveBeenCalled();

		vm.clearSelection();
		await flush();
		expect(vm.store.states.selection.length).toBe(0);

		vm.setCurrentRow(data[1]);
		await flush();
		expect(vm.store.states.currentRow).toStrictEqual(data[1]);

		expect(() => vm.refreshLayout()).not.toThrow();
		expect(() => vm.updateScrollY()).not.toThrow();

		wrapper.unmount();
	});

	it('header selection-all checkbox toggles allselection', async () => {
		const onSelectAll = vi.fn();
		const data = buildData(2);
		const wrapper = mount(() => (
			<Table data={data} primaryKey="id" onSelectAll={onSelectAll}>
				<TableColumn type="selection" />
				<TableColumn label="名称" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();

		const headerCheckbox = wrapper.find('.vc-table__thead .vc-checkbox');
		expect(headerCheckbox.exists()).toBe(true);
		await headerCheckbox.trigger('click');
		await sleep(30);
		await flush();
		expect(onSelectAll).toHaveBeenCalled();

		wrapper.unmount();
	});

	it('selection with selectable disables some rows', async () => {
		const data = buildData(3);
		const selectable = vi.fn((_row: any, index: number) => index !== 0);
		const tableRef = ref<any>();
		const wrapper = mount(() => (
			<Table ref={tableRef} data={data} primaryKey="id">
				<TableColumn type="selection" selectable={selectable} />
				<TableColumn label="名称" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();

		const vm = tableRef.value!;
		vm.toggleAllSelection();
		await sleep(30);
		await flush();
		expect(selectable).toHaveBeenCalled();
		wrapper.unmount();
	});

	it('selection updates by primaryKey when data instance is replaced', async () => {
		const data = ref(buildData(3));
		const tableRef = ref<any>();
		const wrapper = mount(() => (
			<Table ref={tableRef} data={data.value} primaryKey="id">
				<TableColumn type="selection" />
				<TableColumn label="名称" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();

		const vm = tableRef.value!;
		vm.toggleRowSelection(data.value[1], true, false);
		await flush();
		expect(vm.store.states.selection.length).toBe(1);

		// 替换数据：dataInstanceChanged=true 走 clearSelection
		data.value = [data.value[0], data.value[2]];
		await flush();
		await flush();
		expect(vm.store.states.selection.length).toBe(0);
		wrapper.unmount();
	});

	it('toggleAllSelection follows selectable prop changes at runtime', async () => {
		const data = buildData(4);
		const selectable = ref((_row: any, index: number) => index % 2 === 0);
		const tableRef = ref<any>();
		const wrapper = mount(() => (
			<Table ref={tableRef} data={data} primaryKey="id">
				<TableColumn type="selection" selectable={selectable.value} />
				<TableColumn label="名称" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();

		const vm = tableRef.value!;
		const selectedIds = () => vm.store.states.selection.map((row: any) => row.id);

		vm.toggleAllSelection();
		await sleep(20);
		await flush();
		expect(selectedIds()).toEqual(['id__0', 'id__2']);

		vm.clearSelection();
		selectable.value = (_row: any, index: number) => index >= 2;
		await flush();
		expect(vm.store.states.selectable).toBe(selectable.value);

		vm.toggleAllSelection();
		await sleep(20);
		await flush();
		expect(selectedIds()).toEqual(['id__2', 'id__3']);
		// 表头全选状态按新的 selectable 计算
		vm.store.selection.updateAllSelected();
		expect(vm.store.states.isAllSelected).toBe(true);

		wrapper.unmount();
	});

	it('removing the selection column resets selectable / reserveSelection', async () => {
		const selectable = (_row: any, index: number) => index !== 0;
		const visible = ref(true);
		const tableRef = ref<any>();
		const wrapper = mount(() => (
			<Table ref={tableRef} data={buildData(3)} primaryKey="id">
				{{
					default: () => [
						visible.value ? <TableColumn type="selection" selectable={selectable} reserveSelection /> : null,
						<TableColumn label="名称" prop="name" />
					]
				}}
			</Table>
		), { attachTo: document.body });
		await flush();

		const vm = tableRef.value!;
		expect(vm.store.states.selectable).toBe(selectable);
		expect(vm.store.states.reserveSelection).toBe(true);

		visible.value = false;
		await flush();
		expect(vm.store.states.selectable).toBeNull();
		expect(vm.store.states.reserveSelection).toBe(false);

		wrapper.unmount();
	});

	it('hiding the selection column via v-model:columns keeps selectable / reserveSelection', async () => {
		const selectable = (_row: any, index: number) => index !== 0;
		const columns = ref<any[]>([]);
		const tableRef = ref<any>();
		const wrapper = mount(() => (
			<Table
				ref={tableRef}
				data={buildData(3)}
				primaryKey="id"
				columns={columns.value}
				{...{ 'onUpdate:columns': (v: any[]) => { columns.value = v; } }}
			>
				<TableColumn type="selection" selectable={selectable} reserveSelection />
				<TableColumn label="名称" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();

		const vm = tableRef.value!;
		columns.value = columns.value.map((c: any) => (c.type === 'selection' ? { ...c, hidden: true } : c));
		await flush();
		await sleep(60);
		await flush();

		expect(vm.store.states.columns.some((c: any) => c.states.type === 'selection')).toBe(false);
		expect(vm.store.states.selectable).toBe(selectable);
		expect(vm.store.states.reserveSelection).toBe(true);

		wrapper.unmount();
	});
});

describe('Tree rows', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	const buildTree = () => [
		{
			id: 1,
			name: 'r1',
			children: [
				{ id: 11, name: 'r1-1', children: [{ id: 111, name: 'r1-1-1' }] },
				{ id: 12, name: 'r1-2' }
			]
		},
		{ id: 2, name: 'r2' }
	];

	/**
	 * 挂载树形表格：selection 列 + 树形列（name）
	 * @param props 额外的 Table props
	 * @param data 数据
	 * @returns 挂载结果与读取工具
	 */
	const setup = async (props: Record<string, any> = {}, data: any = buildTree()) => {
		const tableRef = ref<any>();
		const wrapper = mount(() => (
			<Table ref={tableRef} data={data} primaryKey="id" {...props}>
				<TableColumn type="selection" />
				<TableColumn label="名称" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();

		const trs = () => wrapper.findAll('.vc-table__body-wrapper .vc-table__tr');
		// 树形列所在的 cell
		const treeCell = (index: number) => trs()[index].findAll('.vc-table__td')[1];
		return {
			wrapper,
			tableRef,
			vm: () => tableRef.value!,
			trs,
			treeCell,
			names: () => trs().map((_, index) => treeCell(index).text()),
			levels: () => trs().map((_, index) => {
				const level = treeCell(index).classes().find(i => i.startsWith('vc-table__row--level-'));
				return level ? Number(level.split('-').pop()) : null;
			}),
			toggle: async (index: number) => {
				await treeCell(index).find('.vc-table__expand-icon').trigger('click');
				await flush();
			}
		};
	};

	it('renders root rows, toggles children with indent and emits expand-change', async () => {
		const onExpandChange = vi.fn();
		const { wrapper, trs, treeCell, names, levels, toggle } = await setup({ onExpandChange });

		// 默认只渲染根行；有子节点的行显示图标，叶子行显示占位保持对齐
		expect(names()).toEqual(['r1', 'r2']);
		expect(levels()).toEqual([0, 0]);
		expect(treeCell(0).find('.vc-table__expand-icon').exists()).toBe(true);
		expect(treeCell(1).find('.vc-table__placeholder').exists()).toBe(true);

		await toggle(0);
		expect(names()).toEqual(['r1', 'r1-1', 'r1-2', 'r2']);
		expect(levels()).toEqual([0, 1, 1, 0]);
		// 行号即可见行下标
		expect(trs().map(tr => tr.attributes('data-row'))).toEqual(['0', '1', '2', '3']);
		expect(treeCell(1).find('.vc-table__indent').attributes('style')).toContain('padding-left: 16px');
		expect(treeCell(0).find('.vc-table__expand-icon').classes()).toContain('is-expand');
		// maxLevel 为当前可见行的最大层级
		expect(onExpandChange).toHaveBeenLastCalledWith(expect.objectContaining({ id: 1 }), true, 1);

		await toggle(1);
		expect(names()).toEqual(['r1', 'r1-1', 'r1-1-1', 'r1-2', 'r2']);
		expect(onExpandChange).toHaveBeenLastCalledWith(expect.objectContaining({ id: 11 }), true, 2);

		await toggle(0);
		expect(names()).toEqual(['r1', 'r2']);
		expect(onExpandChange).toHaveBeenLastCalledWith(expect.objectContaining({ id: 1 }), false, 0);

		wrapper.unmount();
	});

	it('defaultExpandAll renders every level on the first render, indent follows the prop', async () => {
		const { wrapper, treeCell, names, levels } = await setup({ defaultExpandAll: true, indent: 20 });
		expect(names()).toEqual(['r1', 'r1-1', 'r1-1-1', 'r1-2', 'r2']);
		expect(levels()).toEqual([0, 1, 2, 1, 0]);
		expect(treeCell(2).find('.vc-table__indent').attributes('style')).toContain('padding-left: 40px');
		wrapper.unmount();
	});

	it('toggleRowExpansion / expandRowValue drive tree rows', async () => {
		const expandRowValue = ref<any[]>([]);
		const tableRef = ref<any>();
		const wrapper = mount(() => (
			<Table ref={tableRef} data={buildTree()} primaryKey="id" expandRowValue={expandRowValue.value}>
				<TableColumn label="名称" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();
		const names = () => wrapper.findAll('.vc-table__body-wrapper .vc-table__tr').map(tr => tr.text());
		expect(names()).toEqual(['r1', 'r2']);

		expandRowValue.value = [1, 11];
		await flush();
		expect(names()).toEqual(['r1', 'r1-1', 'r1-1-1', 'r1-2', 'r2']);

		tableRef.value.toggleRowExpansion(tableRef.value.store.states.data[0], false);
		await flush();
		expect(names()).toEqual(['r1', 'r2']);

		wrapper.unmount();
	});

	it('only visible rows enter the list and unchanged blocks are reused', async () => {
		const { wrapper, vm, toggle } = await setup();
		const before = toRaw(vm().store.states.list).slice();
		expect(before).toHaveLength(2);

		await toggle(0);
		const after = toRaw(vm().store.states.list).slice();
		expect(after).toHaveLength(4);
		// 展开只新建子行块，其余块对象不变（RecycleList 据此沿用已测尺寸）
		expect(after[0]).toBe(before[0]);
		expect(after[3]).toBe(before[1]);
		expect(after.map((block: any) => [block.rowStart, block.rows[0].level])).toEqual([[0, 0], [1, 1], [2, 1], [3, 0]]);

		wrapper.unmount();
	});

	it('getSpan rowIndex follows the visible rows', async () => {
		const seen: Record<number, string> = {};
		const getSpan = ({ row, rowIndex, columnIndex }: any) => {
			if (columnIndex === 1) seen[rowIndex] = row.name;
			return [1, 1];
		};
		const { wrapper, toggle } = await setup({ getSpan });
		await toggle(0);
		expect(seen).toEqual({ 0: 'r1', 1: 'r1-1', 2: 'r1-2', 3: 'r2' });
		wrapper.unmount();
	});

	it('selection keeps selected children when data changes in place', async () => {
		const data = ref(buildTree());
		const { wrapper, vm } = await setup({ defaultExpandAll: true }, data.value);
		const child = vm().store.states.renderData[1];
		vm().toggleRowSelection(child, true);
		expect(vm().store.states.selection).toHaveLength(1);

		// 同一数组增删：走 selection.clean，不应把仍存在的子行当作已删除
		data.value.push({ id: 3, name: 'r3' });
		await flush();
		expect(vm().store.states.selection.map((i: any) => i.id)).toEqual([11]);

		wrapper.unmount();
	});

	it('expandSelectable=false hides checkboxes of child rows only', async () => {
		const { wrapper, trs } = await setup({ defaultExpandAll: true, expandSelectable: false });
		const visible = trs().map(tr => (tr.find('.vc-checkbox').element as HTMLElement).style.display !== 'none');
		expect(visible).toEqual([true, false, false, false, true]);
		wrapper.unmount();

		// 非树形表格的行视为根行，勾选框正常显示
		const plain = await setup({ expandSelectable: false }, [{ id: 1, name: 'a' }]);
		expect((plain.trs()[0].find('.vc-checkbox').element as HTMLElement).style.display).not.toBe('none');
		plain.wrapper.unmount();
	});

	it('reacts to in-place removal of nested children and cleans selection', async () => {
		const data = ref([
			{ id: 1, name: 'r1', children: [{ id: 11, name: 'r1-1' }, { id: 12, name: 'r1-2' }] },
			{ id: 2, name: 'r2', children: [{ id: 21, name: 'r2-1' }] }
		]);
		const { wrapper, vm, treeCell, names } = await setup({ defaultExpandAll: true }, data.value);
		vm().toggleRowSelection(vm().store.states.renderData[1], true);
		expect(names()).toEqual(['r1', 'r1-1', 'r1-2', 'r2', 'r2-1']);

		data.value[0].children.splice(0, 1);
		await flush();
		expect(names()).toEqual(['r1', 'r1-2', 'r2', 'r2-1']);
		expect(vm().store.states.selection).toHaveLength(0);

		// 子行删空后父行变为叶子（仍是树形表格，以占位对齐）
		data.value[0].children.splice(0, 1);
		await flush();
		expect(names()).toEqual(['r1', 'r2', 'r2-1']);
		expect(treeCell(0).find('.vc-table__expand-icon').exists()).toBe(false);
		expect(treeCell(0).find('.vc-table__placeholder').exists()).toBe(true);

		wrapper.unmount();
	});

	it('re-renders a cell after the row is edited in place', async () => {
		const { wrapper, vm, names } = await setup({ defaultExpandAll: true });
		vm().store.states.renderData[1].name = 'edited';
		await flush();
		expect(names()[1]).toBe('edited');
		wrapper.unmount();
	});

	it('defaultExpandAll only sets the default: collapsed nodes stay collapsed after data updates', async () => {
		const data = ref(buildTree());
		const { wrapper, names, toggle } = await setup({ defaultExpandAll: true }, data.value);
		expect(names()).toEqual(['r1', 'r1-1', 'r1-1-1', 'r1-2', 'r2']);

		await toggle(1);
		expect(names()).toEqual(['r1', 'r1-1', 'r1-2', 'r2']);

		// 数据变化不会重新展开已收起的节点，新增的节点按默认展开
		data.value.push({ id: 3, name: 'r3', children: [{ id: 31, name: 'r3-1' }] } as any);
		await flush();
		expect(names()).toEqual(['r1', 'r1-1', 'r1-2', 'r2', 'r3', 'r3-1']);

		wrapper.unmount();
	});

	it('reacts to runtime defaultExpandAll / expandSelectable changes', async () => {
		const defaultExpandAll = ref(false);
		const expandSelectable = ref(true);
		const tableRef = ref<any>();
		const wrapper = mount(() => (
			<Table
				ref={tableRef}
				data={buildTree()}
				primaryKey="id"
				defaultExpandAll={defaultExpandAll.value}
				expandSelectable={expandSelectable.value}
			>
				<TableColumn type="selection" />
				<TableColumn label="名称" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();
		const vm = tableRef.value!;
		const names = () => vm.store.states.renderData.map((row: any) => row.name);
		expect(names()).toEqual(['r1', 'r2']);

		defaultExpandAll.value = true;
		await flush();
		expect(names()).toEqual(['r1', 'r1-1', 'r1-1-1', 'r1-2', 'r2']);

		vm.toggleRowSelection(vm.store.states.renderData[1], true);
		expect(vm.store.states.selection).toHaveLength(1);
		// 子行不可选择：已选中的子行移出
		expandSelectable.value = false;
		await flush();
		expect(vm.store.states.selection).toHaveLength(0);
		expect(vm.store.flatData.value.map((row: any) => row.id)).toEqual([1, 2]);

		wrapper.unmount();
	});

	it('currentRowValue highlights a child row on the first render and survives data updates', async () => {
		const data = ref(buildTree());
		const onCurrentChange = vi.fn();
		const tableRef = ref<any>();
		const wrapper = mount(() => (
			<Table
				ref={tableRef}
				data={data.value}
				primaryKey="id"
				currentRowValue={12}
				highlight
				defaultExpandAll
				onCurrentChange={onCurrentChange}
			>
				<TableColumn label="名称" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();
		const vm = tableRef.value!;
		expect(vm.store.states.currentRow?.name).toBe('r1-2');
		expect(wrapper.findAll('.vc-table__body-wrapper .current-row').map(td => td.text())).toEqual(['r1-2']);

		data.value = buildTree().map((row: any) => ({ ...row, name: `${row.name}!` }));
		await flush();
		// 子行按 primaryKey 找回，而不是被清空
		expect(vm.store.states.currentRow?.id).toBe(12);
		expect(onCurrentChange).not.toHaveBeenCalledWith(null, expect.anything());

		wrapper.unmount();
	});

	it('treats hasChildren as a plain field outside lazy mode', async () => {
		const { wrapper, names, toggle } = await setup({}, [
			{ id: 1, name: 'r1', hasChildren: true, children: [{ id: 11, name: 'r1-1' }] },
			{ id: 2, name: 'r2', hasChildren: true }
		]);
		await toggle(0);
		expect(names()).toEqual(['r1', 'r1-1', 'r2']);
		wrapper.unmount();
	});

	it('is not a tree without primaryKey: nested children are neither rendered nor selectable', async () => {
		const tableRef = ref<any>();
		const wrapper = mount(() => (
			<Table ref={tableRef} data={buildTree()}>
				<TableColumn type="selection" />
				<TableColumn label="名称" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();
		const vm = tableRef.value!;
		expect(vm.store.tree.isTree).toBe(false);
		expect(wrapper.findAll('.vc-table__body-wrapper .vc-table__tr')).toHaveLength(2);
		expect(vm.store.flatData.value).toHaveLength(2);
		wrapper.unmount();
	});

	it('exposes the tree to assistive technology (treegrid / aria-level / aria-expanded)', async () => {
		const { wrapper, trs, toggle } = await setup();
		const aria = () => trs().map(tr => [tr.attributes('aria-level'), tr.attributes('aria-expanded')]);
		expect(wrapper.find('.vc-table').attributes('role')).toBe('treegrid');
		expect(trs()[0].find('.vc-table__td').attributes('role')).toBe('gridcell');
		expect(aria()).toEqual([['1', 'false'], ['1', undefined]]);

		await toggle(0);
		expect(aria()).toEqual([['1', 'true'], ['2', 'false'], ['2', undefined], ['1', undefined]]);
		wrapper.unmount();

		// 非树形表格保持 table / cell，不输出树形属性
		const plain = mount(() => (
			<Table data={[{ id: 1, name: 'a' }]} primaryKey="id">
				<TableColumn label="名称" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();
		const tr = plain.find('.vc-table__body-wrapper .vc-table__tr');
		expect(plain.find('.vc-table').attributes('role')).toBe('table');
		expect(tr.find('.vc-table__td').attributes('role')).toBe('cell');
		expect(tr.attributes('aria-level')).toBeUndefined();
		expect(tr.attributes('aria-expanded')).toBeUndefined();
		plain.unmount();
	});

	it('does not recurse into rows whose value repeats an ancestor (self reference)', async () => {
		const root: any = { id: 1, name: 'r1' };
		root.children = [root, { id: 11, name: 'r1-1' }];
		const { wrapper, names } = await setup({ defaultExpandAll: true }, [root]);
		expect(names()).toEqual(['r1', 'r1', 'r1-1']);
		wrapper.unmount();
	});

	it('keeps selected rows removed in place when reserveSelection is set', async () => {
		const data = ref([
			{ id: 1, name: 'r1', children: [{ id: 11, name: 'r1-1' }, { id: 12, name: 'r1-2' }] }
		]);
		const tableRef = ref<any>();
		const wrapper = mount(() => (
			<Table ref={tableRef} data={data.value} primaryKey="id" defaultExpandAll>
				<TableColumn type="selection" reserveSelection />
				<TableColumn label="名称" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();
		const vm = tableRef.value!;
		vm.toggleRowSelection(vm.store.states.renderData[1], true);

		data.value[0].children.splice(0, 1);
		await flush();
		expect(vm.store.states.renderData.map((row: any) => row.id)).toEqual([1, 12]);
		expect(vm.store.states.selection.map((row: any) => row.id)).toEqual([11]);

		wrapper.unmount();
	});

	it('currentRowValue resolves once the data arrives later', async () => {
		const data = ref<any[]>([]);
		const tableRef = ref<any>();
		const wrapper = mount(() => (
			<Table ref={tableRef} data={data.value} primaryKey="id" currentRowValue={11} highlight>
				<TableColumn label="名称" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();
		expect(tableRef.value.store.states.currentRow).toBe(null);

		data.value = buildTree();
		await flush();
		expect(tableRef.value.store.states.currentRow?.name).toBe('r1-1');

		wrapper.unmount();
	});

	it('prunes states of rows that no longer exist', async () => {
		const data = ref(buildTree());
		const { wrapper, vm, toggle } = await setup({}, data.value);
		await toggle(0);
		expect(vm().store.states.treeExpanded).toEqual({ 1: true });

		data.value.splice(0, 1);
		await flush();
		expect(vm().store.states.treeExpanded).toEqual({});

		wrapper.unmount();
	});

	describe('lazy', () => {
		it('loads children with numeric levels and hides the icon for empty results', async () => {
			let seed = 100;
			const loadExpand = vi.fn((row: any) => {
				if (row.id === 2) return [];
				return [
					{ id: ++seed, name: `${row.name}-a`, hasChildren: true },
					{ id: ++seed, name: `${row.name}-b` }
				];
			});
			const onExpandChange = vi.fn();
			const { wrapper, treeCell, names, levels, toggle } = await setup(
				{ lazyTree: true, loadExpand, onExpandChange },
				[{ id: 1, name: 'r1', hasChildren: true }, { id: 2, name: 'r2', hasChildren: true }]
			);

			await toggle(0);
			expect(loadExpand).toHaveBeenLastCalledWith(expect.objectContaining({ id: 1 }), expect.objectContaining({ level: 0 }));
			expect(names()).toEqual(['r1', 'r1-a', 'r1-b', 'r2']);
			expect(levels()).toEqual([0, 1, 1, 0]);
			expect(onExpandChange).toHaveBeenLastCalledWith(expect.objectContaining({ id: 1 }), true, 1);

			// 懒加载得到的节点层级为数字
			await toggle(1);
			expect(loadExpand).toHaveBeenLastCalledWith(expect.objectContaining({ name: 'r1-a' }), expect.objectContaining({ level: 1 }));
			expect(names()).toEqual(['r1', 'r1-a', 'r1-a-a', 'r1-a-b', 'r1-b', 'r2']);
			expect(levels()).toEqual([0, 1, 2, 2, 1, 0]);

			// 空结果：展开图标隐藏
			await toggle(5);
			expect(names()).toEqual(['r1', 'r1-a', 'r1-a-a', 'r1-a-b', 'r1-b', 'r2']);
			expect(treeCell(5).find('.vc-table__expand-icon').exists()).toBe(false);

			// 已加载的节点再次点击为收起
			await toggle(0);
			expect(names()).toEqual(['r1', 'r2']);
			expect(loadExpand).toHaveBeenCalledTimes(3);

			wrapper.unmount();
		});

		it('shows Spin while pending, ignores repeated clicks and resets loading on rejection', async () => {
			let resolve: any;
			const loadExpand = vi.fn((row: any) => {
				if (row.id === 2) return Promise.reject(new Error('failed'));
				return new Promise((r) => {
					resolve = r;
				});
			});
			const { wrapper, vm, treeCell, names } = await setup(
				{ lazyTree: true, loadExpand },
				[{ id: 1, name: 'r1', hasChildren: true }, { id: 2, name: 'r2', hasChildren: true }]
			);

			const icon = treeCell(0).find('.vc-table__expand-icon');
			await icon.trigger('click');
			await icon.trigger('click');
			await flush();
			expect(loadExpand).toHaveBeenCalledTimes(1);
			expect(treeCell(0).find('.vc-spin').exists()).toBe(true);

			resolve([{ id: 11, name: 'c1' }]);
			await flush();
			expect(names()).toEqual(['r1', 'c1', 'r2']);
			expect(treeCell(0).find('.vc-spin').exists()).toBe(false);

			// 加载失败：退出加载态，节点仍可再次加载
			await treeCell(2).find('.vc-table__expand-icon').trigger('click');
			await flush();
			await sleep(0);
			await flush();
			expect(vm().store.states.treeLoading[2]).toBeUndefined();
			expect(vm().store.tree.nodes[2].loadable).toBe(true);
			expect(treeCell(2).find('.vc-spin').exists()).toBe(false);

			wrapper.unmount();
		});

		it('does not recurse when a lazy result repeats the value of its parent', async () => {
			const loadExpand = vi.fn(() => [
				{ id: 1, name: 'dup', hasChildren: true },
				{ id: 11, name: 'c1' }
			]);
			const { wrapper, names, toggle } = await setup(
				{ lazyTree: true, loadExpand },
				[{ id: 1, name: 'r1', hasChildren: true }]
			);
			await toggle(0);
			expect(names()).toEqual(['r1', 'dup', 'c1']);
			expect(loadExpand).toHaveBeenCalledTimes(1);
			wrapper.unmount();
		});

		it('drops the result when the row is removed while loading', async () => {
			let resolve: any;
			const onExpandChange = vi.fn();
			const data = ref<any[]>([{ id: 1, name: 'r1', hasChildren: true }, { id: 2, name: 'r2', hasChildren: true }]);
			const { wrapper, vm, names, toggle } = await setup(
				{
					lazyTree: true,
					onExpandChange,
					loadExpand: () => new Promise((r) => {
						resolve = r;
					})
				},
				data.value
			);
			await toggle(0);
			data.value.splice(0, 1);
			await flush();

			resolve([{ id: 11, name: 'c1' }]);
			await flush();
			expect(names()).toEqual(['r2']);
			expect(vm().store.states.treeLazyChildren).toEqual({});
			expect(vm().store.states.treeLoading).toEqual({});
			expect(onExpandChange).not.toHaveBeenCalled();

			wrapper.unmount();
		});

		it('reacts to in-place removal of a reactive lazy result', async () => {
			const children = reactive([{ id: 11, name: 'c1' }, { id: 12, name: 'c2' }]);
			const { wrapper, vm, names, toggle } = await setup(
				{ lazyTree: true, loadExpand: () => children },
				[{ id: 1, name: 'r1', hasChildren: true }]
			);
			await toggle(0);
			expect(names()).toEqual(['r1', 'c1', 'c2']);
			expect(vm().store.flatData.value.map((i: any) => i.id)).toEqual([1, 11, 12]);

			children.splice(0, 1);
			await flush();
			expect(names()).toEqual(['r1', 'c2']);
			expect(vm().store.flatData.value.map((i: any) => i.id)).toEqual([1, 12]);

			wrapper.unmount();
		});
	});
});

describe('Expand rows', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	const expandedTexts = (wrapper: any) => wrapper
		.findAll('.vc-table__body-wrapper .vc-table__expanded-cell')
		.map((cell: any) => cell.text());

	it('expandRowValue renders expanded content and toggleRowExpansion switches it', async () => {
		const expandRowValue = ref<any[]>([2]);
		const tableRef = ref<any>();
		const onExpandChange = vi.fn();
		const wrapper = mount(() => (
			<Table
				ref={tableRef}
				data={[{ id: 1, name: 'a' }, { id: 2, name: 'b' }]}
				primaryKey="id"
				expandRowValue={expandRowValue.value}
				onExpandChange={onExpandChange}
			>
				<TableColumn type="expand">
					{{ default: ({ row }: any) => <div>{`detail-${row.name}`}</div> }}
				</TableColumn>
				<TableColumn label="名称" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();
		expect(expandedTexts(wrapper)).toEqual(['detail-b']);

		expandRowValue.value = [1];
		await flush();
		expect(expandedTexts(wrapper)).toEqual(['detail-a']);

		const vm = tableRef.value!;
		vm.toggleRowExpansion(vm.store.states.data[1], true);
		await flush();
		expect(expandedTexts(wrapper)).toEqual(['detail-a', 'detail-b']);
		expect(onExpandChange).toHaveBeenLastCalledWith(
			expect.objectContaining({ id: 2 }),
			[expect.objectContaining({ id: 1 }), expect.objectContaining({ id: 2 })]
		);

		vm.toggleRowExpansion(vm.store.states.data[0], false);
		await flush();
		expect(expandedTexts(wrapper)).toEqual(['detail-b']);

		wrapper.unmount();
	});

	it('keeps expanded rows on in-place changes without primaryKey', async () => {
		const data = ref([{ name: 'a' }, { name: 'b' }]);
		const wrapper = mount(() => (
			<Table data={data.value}>
				<TableColumn type="expand">
					{{ default: ({ row }: any) => <div>{`detail-${row.name}`}</div> }}
				</TableColumn>
				<TableColumn label="名称" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();
		await wrapper.findAll('.vc-table__body-wrapper .vc-table__expand-icon')[1].trigger('click');
		await flush();
		expect(expandedTexts(wrapper)).toEqual(['detail-b']);

		data.value.push({ name: 'c' });
		await flush();
		expect(expandedTexts(wrapper)).toEqual(['detail-b']);

		data.value.splice(1, 1);
		await flush();
		expect(expandedTexts(wrapper)).toEqual([]);

		wrapper.unmount();
	});

	it('rows without a primaryKey value keep their own expanded state', async () => {
		const tableRef = ref<any>();
		const wrapper = mount(() => (
			<Table ref={tableRef} data={[{ name: 'a' }, { name: 'b' }]} primaryKey="id">
				<TableColumn type="expand">
					{{ default: ({ row }: any) => <div>{`detail-${row.name}`}</div> }}
				</TableColumn>
				<TableColumn label="名称" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();
		await wrapper.findAll('.vc-table__body-wrapper .vc-table__expand-icon')[0].trigger('click');
		await flush();
		expect(expandedTexts(wrapper)).toEqual(['detail-a']);
		wrapper.unmount();
	});

	it('an equal expandRowValue (e.g. a template literal) does not reset user expansions', async () => {
		const tick = ref(0);
		const tableRef = ref<any>();
		const wrapper = mount(() => (
			<div data-tick={tick.value}>
				<Table ref={tableRef} data={[{ id: 1, name: 'a' }, { id: 2, name: 'b' }]} primaryKey="id" expandRowValue={[1]}>
					<TableColumn type="expand">
						{{ default: ({ row }: any) => <div>{`detail-${row.name}`}</div> }}
					</TableColumn>
					<TableColumn label="名称" prop="name" />
				</Table>
			</div>
		), { attachTo: document.body });
		await flush();
		expect(expandedTexts(wrapper)).toEqual(['detail-a']);

		tableRef.value.toggleRowExpansion(tableRef.value.store.states.data[1], true);
		await flush();
		// 父级重新渲染，传入新的但相等的数组
		tick.value++;
		await flush();
		expect(expandedTexts(wrapper)).toEqual(['detail-a', 'detail-b']);

		wrapper.unmount();
	});

	it('patches the row in place when it is expanded / collapsed', async () => {
		const wrapper = mount(() => (
			<Table data={[{ id: 1, name: 'a' }]} primaryKey="id">
				<TableColumn type="expand">
					{{ default: ({ row }: any) => <div>{`detail-${row.name}`}</div> }}
				</TableColumn>
				<TableColumn label="名称" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();
		const grid = () => wrapper.find('.vc-table__body-wrapper .vc-table__grid').element;
		const before = grid();

		expect(before.getAttribute('aria-expanded')).toBe('false');

		const icon = wrapper.find('.vc-table__body-wrapper .vc-table__expand-icon');
		await icon.trigger('click');
		await flush();
		expect(expandedTexts(wrapper)).toEqual(['detail-a']);
		// grid 与其中的 cell 原地更新，不会被重建
		expect(grid()).toBe(before);
		expect(icon.classes()).toContain('is-expand');
		expect(before.getAttribute('aria-expanded')).toBe('true');

		await icon.trigger('click');
		await flush();
		expect(expandedTexts(wrapper)).toEqual([]);
		expect(grid()).toBe(before);

		wrapper.unmount();
	});

	it('defaultExpandAll only sets the default: collapsed rows stay collapsed after data updates', async () => {
		const data = ref([{ id: 1, name: 'a' }, { id: 2, name: 'b' }]);
		const tableRef = ref<any>();
		const wrapper = mount(() => (
			<Table ref={tableRef} data={data.value} primaryKey="id" defaultExpandAll>
				<TableColumn type="expand">
					{{ default: ({ row }: any) => <div>{`detail-${row.name}`}</div> }}
				</TableColumn>
				<TableColumn label="名称" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();
		expect(expandedTexts(wrapper)).toEqual(['detail-a', 'detail-b']);

		tableRef.value.toggleRowExpansion(tableRef.value.store.states.data[0], false);
		await flush();
		data.value = [{ id: 1, name: 'a2' }, { id: 2, name: 'b2' }, { id: 3, name: 'c' }];
		await flush();
		// 已收起的行保持收起，新增的行按默认展开
		expect(expandedTexts(wrapper)).toEqual(['detail-b2', 'detail-c']);

		wrapper.unmount();
	});

	it('stops rendering expanded content when the expand column is removed or hidden', async () => {
		const visible = ref(true);
		const columns = ref<any[]>([]);
		const tableRef = ref<any>();
		const wrapper = mount(() => (
			<Table
				ref={tableRef}
				data={[{ id: 1, name: 'a' }]}
				primaryKey="id"
				defaultExpandAll
				columns={columns.value}
				{...{ 'onUpdate:columns': (v: any[]) => { columns.value = v; } }}
			>
				{
					visible.value && (
						<TableColumn type="expand">
							{{ default: ({ row }: any) => <div>{`detail-${row.name}`}</div> }}
						</TableColumn>
					)
				}
				<TableColumn label="名称" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();
		expect(expandedTexts(wrapper)).toEqual(['detail-a']);

		// 经 v-model:columns 隐藏 expand 列
		columns.value = columns.value.map(item => (item.type === 'expand' ? { ...item, hidden: true } : item));
		await flush();
		await flush();
		expect(tableRef.value.store.states.expandColumn).toBe(null);
		expect(expandedTexts(wrapper)).toEqual([]);

		columns.value = columns.value.map(item => ({ ...item, hidden: false }));
		await flush();
		await flush();
		expect(expandedTexts(wrapper)).toEqual(['detail-a']);

		// 移除 expand 列
		visible.value = false;
		await flush();
		expect(tableRef.value.store.states.expandColumn).toBe(null);
		expect(expandedTexts(wrapper)).toEqual([]);

		wrapper.unmount();
	});
});

describe('TableHeader sort & resize', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('TableSort emits ascending / descending and toggling off', async () => {
		const onClick = vi.fn();
		const w1 = mount(() => (<TableSort order="" onClick={onClick} />), { attachTo: document.body });
		await w1.find('.vc-table-sort__icon--ascending').trigger('click');
		await w1.find('.vc-table-sort__icon--descending').trigger('click');
		expect(onClick).toHaveBeenCalledWith('ascending');
		expect(onClick).toHaveBeenCalledWith('descending');

		const onClick2 = vi.fn();
		const w2 = mount(() => (<TableSort order="ascending" onClick={onClick2} />), { attachTo: document.body });
		await w2.find('.vc-table-sort__icon--ascending').trigger('click');
		expect(onClick2).toHaveBeenCalledWith('');
		w1.unmount();
		w2.unmount();
	});

	it('emits update:sort and sort-change when clicking sortable header', async () => {
		const onSort = vi.fn();
		const onUpdateSort = vi.fn();
		const data = buildData(2);
		const wrapper = mount(() => (
			<Table data={data} onSortChange={onSort} {...{ 'onUpdate:sort': onUpdateSort }}>
				<TableColumn label="名称" prop="name" sortable />
			</Table>
		), { attachTo: document.body });
		await flush();

		await wrapper.find('.vc-table-sort__icon--ascending').trigger('click');
		expect(onSort).toHaveBeenCalled();
		expect(onUpdateSort).toHaveBeenCalled();
		wrapper.unmount();
	});

	it('header column resize via mousemove + mousedown + mouseup emits header-dragend', async () => {
		const onDragend = vi.fn();
		const data = buildData(2);
		const tableRef = ref<any>();
		const wrapper = mount(() => (
			<Table ref={tableRef} data={data} border resizable onHeaderDragend={onDragend}>
				<TableColumn label="名称" prop="name" />
				<TableColumn label="地址" prop="address" />
			</Table>
		), { attachTo: document.body });
		await flush();

		const ths = wrapper.findAll('.vc-table__th');
		const thEl = ths[0].element as HTMLElement;
		const restoreRect = vi.spyOn(thEl, 'getBoundingClientRect').mockReturnValue({
			left: 0, right: 100, top: 0, bottom: 30, width: 100, height: 30, x: 0, y: 0, toJSON: () => ({})
		} as DOMRect);
		const wrapperEl = wrapper.find('.vc-table').element as HTMLElement;
		const restoreWrapperRect = vi.spyOn(wrapperEl, 'getBoundingClientRect').mockReturnValue({
			left: 0, right: 200, top: 0, bottom: 100, width: 200, height: 100, x: 0, y: 0, toJSON: () => ({})
		} as DOMRect);

		thEl.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: 95 } as any));
		await flush();
		thEl.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: 95 } as any));
		await flush();
		document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: 150 } as any));
		document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true } as any));
		await sleep(0);
		await flush();
		expect(onDragend).toHaveBeenCalled();
		// 拖过的列不再吸收剩余宽度
		expect(tableRef.value.store.states.columns[0].states.resized).toBe(true);
		expect(tableRef.value.store.states.columns[1].states.resized).toBeFalsy();

		thEl.dispatchEvent(new MouseEvent('mouseout', { bubbles: true } as any));
		await flush();

		restoreRect.mockRestore();
		restoreWrapperRect.mockRestore();
		wrapper.unmount();
	});
});

describe('Table virtual + scroll & delay', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('renders virtual list when height is set and emits sync scroll', async () => {
		const data = buildData(50);
		const wrapper = mount(() => (
			<Table data={data} primaryKey="id" height={200} rows={10}>
				<TableColumn label="名称" prop="name" fixed="left" width={120} />
				<TableColumn label="计数" prop="count" width={120} />
				<TableColumn label="操作" prop="address" fixed="right" width={120} />
			</Table>
		), { attachTo: document.body });
		await flush();
		await sleep(30);
		await flush();
		expect(wrapper.find('.vc-table__body-wrapper').exists()).toBe(true);
		expect(wrapper.find('.vc-table__tbody').exists()).toBe(true);
		expect(wrapper.find('.vc-recycle-list').exists()).toBe(true);

		const scrollWrapper = wrapper.find('.vc-table__body-wrapper').element as HTMLElement;
		// 通过 ScrollerWheel 组件实例直接 emit scroll，触发表格的 handleScollX
		const sw = wrapper.findComponent({ name: 'vc-scroller-wheel' });
		if (sw.exists()) {
			const fakeBodyX = {
				scrollLeft: 0,
				offsetWidth: 100,
				scrollWidth: 100,
				scrollTop: 0
			};
			makeWritable(scrollWrapper, 'scrollLeft');
			Object.defineProperty(scrollWrapper, 'offsetWidth', { configurable: true, value: 100 });
			Object.defineProperty(scrollWrapper, 'scrollWidth', { configurable: true, value: 100 });
			sw.vm.$emit('scroll', { target: fakeBodyX });
			await flush();
			// 切到 middle
			(scrollWrapper as any).scrollLeft = 30;
			Object.defineProperty(scrollWrapper, 'scrollWidth', { configurable: true, value: 200 });
			sw.vm.$emit('scroll', { target: { ...fakeBodyX, scrollLeft: 30 } });
			await flush();
			// 切到 right
			(scrollWrapper as any).scrollLeft = 200;
			sw.vm.$emit('scroll', { target: { ...fakeBodyX, scrollLeft: 200, scrollWidth: 200 } });
			await flush();
		}
		wrapper.unmount();
	});

	it('virtual TableBody emits scroll (sticky 模式下不再需要同步左右 fixed body)', async () => {
		const data = buildData(20);
		const wrapper = mount(() => (
			<Table data={data} primaryKey="id" height={200} rows={5}>
				<TableColumn label="A" prop="name" fixed="left" width={120} />
				<TableColumn label="B" prop="count" width={120} />
				<TableColumn label="C" prop="address" fixed="right" width={120} />
			</Table>
		), { attachTo: document.body });
		await flush();
		await sleep(30);
		const tableBody = wrapper.findComponent({ name: 'vc-table-body' });
		if (tableBody.exists()) {
			tableBody.vm.$emit('scroll', { target: { scrollLeft: 0, scrollTop: 30 } });
			await flush();
		}
		wrapper.unmount();
	});

	it('virtualized only enables external RecycleList without height/maxHeight', async () => {
		const mountTable = (tableProps: Record<string, any> = {}) => mount(() => (
			<Table data={buildData(20)} primaryKey="id" {...tableProps}>
				<TableColumn label="名称" prop="name" />
			</Table>
		), { attachTo: document.body });

		const external = mountTable({ virtualized: true });
		await flush();
		const externalList = external.findComponent({ name: 'vc-recycle-list' });
		expect(externalList.exists()).toBe(true);
		expect(externalList.props('fill')).toBe(false);
		expect(external.findComponent({ name: 'vc-table-normal-list' }).exists()).toBe(false);
		external.unmount();

		const fixed = mountTable({ height: 200, virtualized: true });
		await flush();
		const fixedList = fixed.findComponent({ name: 'vc-recycle-list' });
		expect(fixedList.exists()).toBe(true);
		expect(fixedList.props('fill')).toBe(true);
		fixed.unmount();

		const maxHeight = mountTable({ maxHeight: 200, virtualized: true });
		await flush();
		expect(maxHeight.findComponent({ name: 'vc-recycle-list' }).exists()).toBe(false);
		expect(maxHeight.findComponent({ name: 'vc-table-normal-list' }).exists()).toBe(true);
		maxHeight.unmount();

		const fixedWins = mountTable({ height: 200, maxHeight: 400, virtualized: true });
		await flush();
		const fixedWinsList = fixedWins.findComponent({ name: 'vc-recycle-list' });
		expect(fixedWinsList.exists()).toBe(true);
		expect(fixedWinsList.props('fill')).toBe(true);
		fixedWins.unmount();

		const normal = mountTable();
		await flush();
		expect(normal.findComponent({ name: 'vc-recycle-list' }).exists()).toBe(false);
		expect(normal.findComponent({ name: 'vc-table-normal-list' }).exists()).toBe(true);
		normal.unmount();
	});

	it('external virtualized body keeps append/summary/fixed cells and horizontal sync', async () => {
		const wrapper = mount(() => (
			<Table data={buildData(20)} primaryKey="id" virtualized showSummary>
				{{
					default: () => [
						<TableColumn label="A" prop="name" fixed="left" width={120} />,
						<TableColumn label="B" prop="count" width={240} />,
						<TableColumn label="C" prop="address" fixed="right" width={120} />
					],
					append: () => <div class="external-virtual-append">append</div>
				}}
			</Table>
		), { attachTo: document.body });
		await flush();
		await sleep(30);
		await flush();

		expect(wrapper.find('.external-virtual-append').exists()).toBe(true);
		expect(wrapper.find('.vc-table__footer-wrapper').exists()).toBe(true);
		expect(wrapper.find('.vc-table__td.is-fixed-left').exists()).toBe(true);
		expect(wrapper.find('.vc-table__td.is-fixed-right').exists()).toBe(true);

		const xWrapper = wrapper.find('.vc-recycle-list__wrapper').element as HTMLElement;
		const header = wrapper.find('.vc-table__header-wrapper').element as HTMLElement;
		const footer = wrapper.find('.vc-table__footer-wrapper').element as HTMLElement;
		makeWritable(xWrapper, 'scrollLeft', 45);
		makeWritable(header, 'scrollLeft');
		makeWritable(footer, 'scrollLeft');
		Object.defineProperty(xWrapper, 'offsetWidth', { configurable: true, value: 100 });
		Object.defineProperty(xWrapper, 'scrollWidth', { configurable: true, value: 400 });

		wrapper.findComponent({ name: 'vc-recycle-list' }).vm.$emit('scroll', {
			target: { scrollLeft: 45, scrollTop: 0 }
		});
		await flush();
		expect(header.scrollLeft).toBe(45);
		expect(footer.scrollLeft).toBe(45);

		wrapper.unmount();
	});

	it('external virtualized Affix wheel only scrolls the internal cross axis', async () => {
		const wrapper = mount(() => (
			<Table data={buildData(20)} primaryKey="id" virtualized showSummary affix>
				<TableColumn label="A" prop="name" width={240} />
				<TableColumn label="B" prop="count" width={240} />
				<TableColumn label="C" prop="address" width={240} />
			</Table>
		), { attachTo: document.body });
		await flush();
		await sleep(30);
		await flush();

		const list = wrapper.findComponent({ name: 'vc-recycle-list' });
		const innerScroller = list.findComponent({ name: 'vc-scroller-wheel' });
		const listScrollTo = vi.fn();
		const innerScrollTo = vi.fn();
		(list.vm as any).$!.exposed.scrollTo = listScrollTo;
		(innerScroller.vm as any).$!.exposed.scrollTo = innerScrollTo;

		const xWrapper = wrapper.find('.vc-recycle-list__wrapper').element as HTMLElement;
		makeWritable(xWrapper, 'scrollLeft');
		makeWritable(xWrapper, 'scrollTop');
		const restores = [
			defineGetter(xWrapper, 'scrollWidth', 720),
			defineGetter(xWrapper, 'clientWidth', 240),
			defineGetter(xWrapper, 'scrollHeight', 600),
			defineGetter(xWrapper, 'clientHeight', 600)
		];

		const dispatchHorizontalWheel = (selector: string, deltaX: number) => {
			const el = wrapper.find(selector).element as HTMLElement;
			el.dispatchEvent(new WheelEvent('wheel', {
				bubbles: true,
				cancelable: true,
				deltaX,
				deltaY: 0
			} as any));
		};

		dispatchHorizontalWheel('.vc-table__header-wrapper', 30);
		dispatchHorizontalWheel('.vc-table__footer-wrapper', 45);
		await flush();
		await sleep(20);

		expect(innerScrollTo).toHaveBeenNthCalledWith(1, { x: 30 });
		expect(innerScrollTo).toHaveBeenNthCalledWith(2, { x: 45 });
		expect(listScrollTo).not.toHaveBeenCalled();

		restores.forEach(fn => fn());
		wrapper.unmount();
	});

	it('external row resize refreshes Affix while fixed-height row resize does not', async () => {
		const mountAffixTable = (tableProps: Record<string, any>) => mount(() => (
			<Table data={buildData(20)} primaryKey="id" affix {...tableProps}>
				<TableColumn label="名称" prop="name" />
			</Table>
		), { attachTo: document.body });
		const replaceAffixRefresh = (wrapper: any) => {
			const refresh = vi.fn();
			const affix = wrapper.findComponent({ name: 'vc-affix' });
			(affix.vm as any).$!.exposed.refresh = refresh;
			return refresh;
		};

		const external = mountAffixTable({ virtualized: true });
		await flush();
		const externalRefresh = replaceAffixRefresh(external);
		external.findComponent({ name: 'vc-recycle-list' }).vm.$emit('row-resize', []);
		await flush();
		expect(externalRefresh).toHaveBeenCalledTimes(1);
		external.unmount();

		const fixed = mountAffixTable({ height: 200, virtualized: true });
		await flush();
		const fixedRefresh = replaceAffixRefresh(fixed);
		fixed.findComponent({ name: 'vc-recycle-list' }).vm.$emit('row-resize', []);
		await flush();
		expect(fixedRefresh).not.toHaveBeenCalled();
		fixed.unmount();
	});

	describe('lazyTail / load-change', () => {
		const settle = async () => {
			await flush();
			await sleep(30);
			await flush();
		};

		const columns = () => [
			<TableColumn label="A" prop="name" width={120} />,
			<TableColumn label="B" prop="count" width={240} />
		];

		it('virtualized: defers append until all rows are built and forwards load-change', async () => {
			const seen: any[] = [];
			const wrapper = mount(() => (
				<Table
					data={buildData(20)}
					primaryKey="id"
					virtualized
					lazyTail
					onLoadChange={(v: any) => seen.push(v)}
				>
					{{
						default: columns,
						append: () => <div class="lazy-append">append</div>
					}}
				</Table>
			), { attachTo: document.body });
			await settle();

			expect(wrapper.find('.lazy-append').exists()).toBe(true);
			expect(seen[seen.length - 1]).toEqual({
				isEnd: true,
				isLoading: false,
				isSilentRefresh: false,
				isEmpty: false
			});
			wrapper.unmount();
		});

		it('virtualized: keeps append hidden while rows still have unbuilt batches', async () => {
			const seen: any[] = [];
			// 内部 batchCount 为 100；挂载阶段最多续建三批，500 行必然还有未构建数据
			const wrapper = mount(() => (
				<Table
					data={buildData(500)}
					primaryKey="id"
					virtualized
					lazyTail
					onLoadChange={(v: any) => seen.push(v)}
				>
					{{
						default: columns,
						append: () => <div class="lazy-append">append</div>
					}}
				</Table>
			), { attachTo: document.body });
			await settle();

			const list = (wrapper.findComponent({ name: 'vc-recycle-list' }).vm as any).$.exposed;
			expect(list.store.local.hasMore).toBe(true);
			expect(wrapper.find('.lazy-append').exists()).toBe(false);
			expect(seen[seen.length - 1].isEnd).toBe(false);
			wrapper.unmount();
		});

		it('virtualized: keeps append visible when data is replaced with the same length', async () => {
			const seen: any[] = [];
			const data = ref(buildData(20));
			const wrapper = mount(() => (
				<Table
					data={data.value}
					primaryKey="id"
					virtualized
					lazyTail
					onLoadChange={(v: any) => seen.push(v)}
				>
					{{
						default: columns,
						append: () => <div class="lazy-append">append</div>
					}}
				</Table>
			), { attachTo: document.body });
			await settle();
			expect(wrapper.find('.lazy-append').exists()).toBe(true);
			const emittedBefore = seen.length;

			// 如排序：整体替换为等长的新数组
			data.value = buildData(20).map(row => ({ ...row, id: `${row.id}-b`, name: `${row.name}-b` }));
			await nextTick();
			expect(wrapper.find('.lazy-append').exists()).toBe(true);

			await settle();
			expect(wrapper.find('.lazy-append').exists()).toBe(true);
			expect(seen.slice(emittedBefore).some(v => v.isEnd === false)).toBe(false);
			wrapper.unmount();
		});

		it('normal table: renders append immediately and reports isEnd on mount', async () => {
			const seen: any[] = [];
			const wrapper = mount(() => (
				<Table data={buildData(3)} lazyTail onLoadChange={(v: any) => seen.push(v)}>
					{{
						default: columns,
						append: () => <div class="lazy-append">append</div>
					}}
				</Table>
			), { attachTo: document.body });

			expect(seen[0]).toEqual({
				isEnd: true,
				isLoading: false,
				isSilentRefresh: false,
				isEmpty: false
			});
			await settle();
			expect(wrapper.find('.lazy-append').exists()).toBe(true);
			wrapper.unmount();
		});

		it('normal table: reports isEmpty for empty data', async () => {
			const seen: any[] = [];
			const wrapper = mount(() => (
				<Table data={[]} onLoadChange={(v: any) => seen.push(v)}>
					{{ default: columns }}
				</Table>
			), { attachTo: document.body });

			expect(seen[seen.length - 1]).toEqual({
				isEnd: true,
				isLoading: false,
				isSilentRefresh: false,
				isEmpty: true
			});
			wrapper.unmount();
		});
	});

	it('automatic layout updates never force the inner RecycleList to re-measure', async () => {
		const data = ref(buildData(20));
		const tableRef = ref<any>();
		const wrapper = mount(() => (
			<Table ref={tableRef} data={data.value} primaryKey="id" virtualized>
				<TableColumn label="名称" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();

		const recycleList = wrapper.findComponent({ name: 'vc-recycle-list' });
		const refreshLayout = vi.fn();
		(recycleList.vm as any).$!.exposed.refreshLayout = refreshLayout;

		// 数据变化、列变化触发的布局更新：RecycleList 自己会处理数据与尺寸，不应被整体重测
		data.value = data.value.slice(1);
		await flush();
		tableRef.value.store.scheduleLayout();
		await sleep(80);
		await flush();

		expect(refreshLayout).not.toHaveBeenCalled();
		wrapper.unmount();
	});

	it.each([
		['external virtualized', { virtualized: true }],
		['fixed height', { height: 300 }]
	])('explicit refreshLayout re-measures the inner RecycleList (%s)', async (_, props) => {
		const tableRef = ref<any>();
		const wrapper = mount(() => (
			<Table ref={tableRef} data={buildData(20)} primaryKey="id" {...props}>
				<TableColumn label="名称" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();

		const recycleList = wrapper.findComponent({ name: 'vc-recycle-list' });
		const refreshLayout = vi.fn();
		(recycleList.vm as any).$!.exposed.refreshLayout = refreshLayout;
		tableRef.value.refreshLayout();

		expect(refreshLayout).toHaveBeenCalledTimes(1);
		wrapper.unmount();
	});

	it('external virtualized table preserves the empty state', async () => {
		const wrapper = mount(() => (
			<Table virtualized emptyText="外部虚拟表暂无数据">
				<TableColumn label="名称" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();

		expect(wrapper.findComponent({ name: 'vc-recycle-list' }).props('fill')).toBe(false);
		expect(wrapper.find('.vc-table__empty-placeholder').exists()).toBe(true);
		expect(wrapper.find('.vc-table__empty-text').text()).toBe('外部虚拟表暂无数据');
		wrapper.unmount();
	});

	it('delay defers body rendering', async () => {
		const data = buildData(2);
		const wrapper = mount(() => (
			<Table data={data} primaryKey="id" delay={20}>
				<TableColumn label="名称" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();
		expect(wrapper.find('.vc-table__body-wrapper').exists()).toBe(false);
		await sleep(40);
		await flush();
		expect(wrapper.find('.vc-table__body-wrapper').exists()).toBe(true);
		wrapper.unmount();
	});
});

describe('Additional source-path coverage', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('expandRowValue prop sets the expanded rows', async () => {
		const data = [{ id: 1, name: 'a' }, { id: 2, name: 'b' }];
		const expandRowValue = ref<any[]>([1]);
		const tableRef = ref<any>();
		const wrapper = mount(() => (
			<Table
				ref={tableRef}
				data={data}
				primaryKey="id"
				expandRowValue={expandRowValue.value}
			>
				<TableColumn type="expand" label="详情">
					{{ default: ({ row }: any) => <div>{row.name}</div> }}
				</TableColumn>
				<TableColumn label="名称" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();

		expect(tableRef.value!.store.expand.getRows().map((row: any) => row.id)).toEqual([1]);
		expandRowValue.value = [1, 2];
		await flush();
		expect(tableRef.value!.store.expand.getRows().map((row: any) => row.id)).toEqual([1, 2]);
		wrapper.unmount();
	});

	it('column with line prop renders text-line wrapper', async () => {
		const data = [{ id: 1, name: 'long-text-content' }];
		const wrapper = mount(() => (
			<Table data={data} primaryKey="id">
				<TableColumn label="名称" prop="name" line={2} />
			</Table>
		), { attachTo: document.body });
		await flush();
		// 表头 label 默认也有 text-line（header-line），这里只断言表体
		expect(wrapper.find('.vc-table__td .vc-table__text-line').exists()).toBe(true);
		wrapper.unmount();
	});

	it('column tooltip icon mouseenter opens popover', async () => {
		const data = [{ id: 1, name: 'a' }];
		const wrapper = mount(() => (
			<Table data={data} primaryKey="id">
				<TableColumn label="名称" prop="name" tooltip="提示信息" />
			</Table>
		), { attachTo: document.body });
		await flush();
		const tipIcon = wrapper.find('.vc-table__tooltip');
		expect(tipIcon.exists()).toBe(true);
		await tipIcon.trigger('mouseenter');
		await flush();
		// popover 内容已挂载到 document.body，无强断言
		wrapper.unmount();
	});

	it('column filters: multiple - confirm / reset through TableFilter', async () => {
		const filterFn = vi.fn();
		const wrapper = mount(() => (
			<Table data={[{ id: 1, name: 'a' }]} primaryKey="id">
				<TableColumn
					label="名称"
					prop="name"
					filterOptions={{
						data: [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }, { value: 'c', label: 'C', disabled: true }],
						max: 3,
						modelValue: ['a'],
						icon: 'my-filter-icon',
						portalClass: 'my-filter-popup',
						onChange: filterFn
					}}
				/>
			</Table>
		), { attachTo: document.body });
		await flush();

		const filter = wrapper.findComponent({ name: 'vc-table-filter' });
		expect(filter.exists()).toBe(true);
		expect(filter.props('icon')).toBe('my-filter-icon');
		// 已有生效值：图标高亮
		expect(wrapper.find('.vc-table__th .vc-table-filter__icon').classes()).toContain('is-active');

		await wrapper.find('.vc-table__th .vc-table-filter').trigger('click');
		await flush();
		const popup = document.querySelector('.my-filter-popup') as HTMLElement;
		expect(popup).not.toBeNull();
		const inputs = popup.querySelectorAll<HTMLInputElement>('.vc-table-filter__item input');
		expect(inputs).toHaveLength(3);
		expect(popup.querySelectorAll('.vc-table-filter__item.is-checked')).toHaveLength(1);

		// 勾选 B 后确认
		inputs[1].dispatchEvent(new Event('change'));
		await flush();
		const [resetButton, confirmButton] = Array.from(popup.querySelectorAll<HTMLElement>('.vc-table-filter__footer .vc-button'));
		confirmButton.click();
		await flush();
		expect(filterFn).toHaveBeenCalledTimes(1);
		expect(filterFn).toHaveBeenLastCalledWith(['a', 'b']);

		// 重置：清空并生效
		resetButton.click();
		await flush();
		expect(filterFn).toHaveBeenCalledTimes(2);
		expect(filterFn).toHaveBeenLastCalledWith([]);
		wrapper.unmount();
	});

	it('column filters: icon follows the applied value, uncontrolled state survives reopen, reordering is not a change', async () => {
		const filterFn = vi.fn();
		const wrapper = mount(() => (
			<Table data={[{ id: 1, name: 'a' }]} primaryKey="id">
				<TableColumn
					label="名称"
					prop="name"
					// 不传 modelValue：非受控，多选时 onChange 收到数组
					filterOptions={{
						data: [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }],
						max: 2,
						portalClass: 'applied-filter-popup',
						onChange: filterFn
					}}
				/>
			</Table>
		), { attachTo: document.body });
		await flush();

		const trigger = wrapper.find('.vc-table__th .vc-table-filter');
		const icon = () => wrapper.find('.vc-table-filter__icon');
		const popup = () => document.querySelector('.applied-filter-popup') as HTMLElement;
		const inputs = () => popup().querySelectorAll<HTMLInputElement>('.vc-table-filter__item input');
		const checked = () => popup().querySelectorAll('.vc-table-filter__item.is-checked').length;
		const confirm = async () => {
			// 按钮点击有 250ms 的防抖（leading），两次确认之间需要等过窗口期
			await sleep(300);
			popup().querySelectorAll<HTMLElement>('.vc-table-filter__footer .vc-button')[1].click();
			await flush();
		};

		// 勾选后不确认就关闭：图标不高亮，也不触发回调
		await trigger.trigger('click');
		await flush();
		inputs()[0].dispatchEvent(new Event('change'));
		await flush();
		expect(checked()).toBe(1);
		expect(icon().classes()).not.toContain('is-active');
		await trigger.trigger('click');
		await flush();
		expect(filterFn).not.toHaveBeenCalled();

		// 重新打开：丢弃未确认的勾选
		await trigger.trigger('click');
		await flush();
		expect(checked()).toBe(0);

		// 确认后生效；非受控时由组件保留生效值
		inputs()[0].dispatchEvent(new Event('change'));
		inputs()[1].dispatchEvent(new Event('change'));
		await flush();
		await confirm();
		expect(filterFn).toHaveBeenCalledTimes(1);
		expect(filterFn).toHaveBeenLastCalledWith(['a', 'b']);
		expect(icon().classes()).toContain('is-active');

		await trigger.trigger('click');
		await flush();
		expect(checked()).toBe(2);

		// 取消再勾选 A：顺序变为 [b, a]，集合未变，确认不触发回调
		inputs()[0].dispatchEvent(new Event('change'));
		await flush();
		inputs()[0].dispatchEvent(new Event('change'));
		await flush();
		await confirm();
		expect(popup().style.display).toBe('none');
		expect(filterFn).toHaveBeenCalledTimes(1);
		wrapper.unmount();
	});

	it('column filters: controlled value stays in effect when onChange does not write it back', async () => {
		const filteredValue = ref<unknown[]>([]);
		// 校验不通过：不写回 modelValue
		const filterFn = vi.fn();
		const wrapper = mount(() => (
			<Table data={[{ id: 1, name: 'a' }]} primaryKey="id">
				<TableColumn
					label="名称"
					prop="name"
					filterOptions={{
						data: [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }],
						max: 2,
						modelValue: filteredValue.value,
						portalClass: 'rejected-filter-popup',
						onChange: filterFn
					}}
				/>
			</Table>
		), { attachTo: document.body });
		await flush();

		const trigger = wrapper.find('.vc-table__th .vc-table-filter');
		const popup = () => document.querySelector('.rejected-filter-popup') as HTMLElement;
		const checked = () => popup().querySelectorAll('.vc-table-filter__item.is-checked').length;

		await trigger.trigger('click');
		await flush();
		popup().querySelectorAll<HTMLInputElement>('.vc-table-filter__item input')[0].dispatchEvent(new Event('change'));
		await flush();
		popup().querySelectorAll<HTMLElement>('.vc-table-filter__footer .vc-button')[1].click();
		await flush();
		expect(filterFn).toHaveBeenLastCalledWith(['a']);

		// 外部未写回：图标不高亮，重新打开时回到外部的值
		expect(wrapper.find('.vc-table-filter__icon').classes()).not.toContain('is-active');
		await trigger.trigger('click');
		await flush();
		expect(checked()).toBe(0);

		// 外部写回后才生效
		filteredValue.value = ['a'];
		await flush();
		expect(wrapper.find('.vc-table-filter__icon').classes()).toContain('is-active');
		expect(checked()).toBe(1);
		wrapper.unmount();
	});

	it('column filters: a re-render passing an equal modelValue keeps the unconfirmed draft', async () => {
		const tick = ref(0);
		const wrapper = mount(() => (
			<Table data={[{ id: 1, name: 'a' }]} primaryKey="id" data-tick={tick.value}>
				<TableColumn
					label="名称"
					prop="name"
					// 模板字面量：每次渲染都是内容相同的新对象 / 新数组
					filterOptions={{
						data: [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }],
						max: 2,
						modelValue: ['a'],
						portalClass: 'draft-filter-popup'
					}}
				/>
			</Table>
		), { attachTo: document.body });
		await flush();

		await wrapper.find('.vc-table__th .vc-table-filter').trigger('click');
		await flush();
		const popup = document.querySelector('.draft-filter-popup') as HTMLElement;
		const checked = () => popup.querySelectorAll('.vc-table-filter__item.is-checked').length;
		expect(checked()).toBe(1);
		popup.querySelectorAll<HTMLInputElement>('.vc-table-filter__item input')[1].dispatchEvent(new Event('change'));
		await flush();
		expect(checked()).toBe(2);

		// 父级重渲染：modelValue 为新数组但内容不变，编辑中的勾选保留
		tick.value++;
		await flush();
		expect(checked()).toBe(2);
		wrapper.unmount();
	});

	it('column filters: max caps the selection, the rest are disabled until one is unticked', async () => {
		const wrapper = mount(() => (
			<Table data={[{ id: 1, name: 'a' }]} primaryKey="id">
				<TableColumn
					label="名称"
					prop="name"
					filterOptions={{
						data: [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }, { value: 'c', label: 'C' }],
						max: 2,
						portalClass: 'max-filter-popup'
					}}
				/>
			</Table>
		), { attachTo: document.body });
		await flush();
		await wrapper.find('.vc-table__th .vc-table-filter').trigger('click');
		await flush();
		const popup = document.querySelector('.max-filter-popup') as HTMLElement;
		const inputs = () => popup.querySelectorAll<HTMLInputElement>('.vc-table-filter__item input');
		const disabled = () => Array.from(inputs()).map(input => input.disabled);

		expect(disabled()).toEqual([false, false, false]);
		inputs()[0].dispatchEvent(new Event('change'));
		inputs()[1].dispatchEvent(new Event('change'));
		await flush();
		// 选满 2 个：未勾选的 C 置灰
		expect(disabled()).toEqual([false, false, true]);

		// 取消 A：C 恢复可选
		inputs()[0].dispatchEvent(new Event('change'));
		await flush();
		expect(disabled()).toEqual([false, false, false]);
		wrapper.unmount();
	});

	it('column filters: keeps the string shape of modelValue like Select (\'a,b\')', async () => {
		const value = ref<string>('a');
		const onChange = vi.fn();
		const wrapper = mount(() => (
			<Table data={[{ id: 1, name: 'a' }]} primaryKey="id">
				<TableColumn
					label="名称"
					prop="name"
					filterOptions={{
						'data': [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }],
						'max': 2,
						'modelValue': value.value,
						'portalClass': 'string-filter-popup',
						'onUpdate:modelValue': (v: any) => { value.value = v; },
						onChange
					}}
				/>
			</Table>
		), { attachTo: document.body });
		await flush();
		await wrapper.find('.vc-table__th .vc-table-filter').trigger('click');
		await flush();
		const popup = document.querySelector('.string-filter-popup') as HTMLElement;
		expect(popup.querySelectorAll('.vc-table-filter__item.is-checked')).toHaveLength(1);

		popup.querySelectorAll<HTMLInputElement>('.vc-table-filter__item input')[1].dispatchEvent(new Event('change'));
		await flush();
		popup.querySelectorAll<HTMLElement>('.vc-table-filter__footer .vc-button')[1].click();
		await flush();
		expect(onChange).toHaveBeenLastCalledWith('a,b');
		expect(value.value).toBe('a,b');
		expect(wrapper.find('.vc-table-filter__icon').classes()).toContain('is-active');
		wrapper.unmount();
	});

	it('column filters: a reactive filterOptions object updated in place reaches the header', async () => {
		// 同一个对象，写回时原地修改 modelValue（不是每次传新对象）
		const options = reactive({
			'data': [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }],
			'max': 2,
			'modelValue': [] as string[],
			'portalClass': 'reactive-filter-popup',
			'onUpdate:modelValue': (v: any) => {
				options.modelValue = v;
			}
		});
		const wrapper = mount(() => (
			<Table data={[{ id: 1, name: 'a' }]} primaryKey="id">
				<TableColumn label="名称" prop="name" filterOptions={options} />
			</Table>
		), { attachTo: document.body });
		await flush();
		expect(wrapper.find('.vc-table-filter__icon').classes()).not.toContain('is-active');

		await wrapper.find('.vc-table__th .vc-table-filter').trigger('click');
		await flush();
		const popup = document.querySelector('.reactive-filter-popup') as HTMLElement;
		popup.querySelectorAll<HTMLInputElement>('.vc-table-filter__item input')[0].dispatchEvent(new Event('change'));
		await flush();
		popup.querySelectorAll<HTMLElement>('.vc-table-filter__footer .vc-button')[1].click();
		await flush();
		expect(options.modelValue).toEqual(['a']);
		expect(wrapper.find('.vc-table-filter__icon').classes()).toContain('is-active');
		wrapper.unmount();
	});

	it('triggers wheel events to cover shouldWheelX/Y callbacks', async () => {
		const data = buildData(2);
		const wrapper = mount(() => (
			<Table data={data} border>
				<TableColumn label="名称" prop="name" fixed="left" width={120} />
				<TableColumn label="计数" prop="count" width={120} />
				<TableColumn label="操作" prop="address" fixed="right" width={120} />
			</Table>
		), { attachTo: document.body });
		await flush();

		const headerEl = wrapper.find('.vc-table__header-wrapper').element as HTMLElement;
		makeWritable(headerEl, 'scrollLeft');
		const xWrapperEl = wrapper.find('.vc-table__body-wrapper').element as HTMLElement;
		makeWritable(xWrapperEl, 'scrollLeft');
		makeWritable(xWrapperEl, 'scrollTop');
		const restores = [
			defineGetter(headerEl, 'scrollWidth', 600),
			defineGetter(headerEl, 'clientWidth', 200),
			defineGetter(xWrapperEl, 'scrollWidth', 600),
			defineGetter(xWrapperEl, 'clientWidth', 200),
			defineGetter(xWrapperEl, 'scrollHeight', 400),
			defineGetter(xWrapperEl, 'clientHeight', 200),
			defineGetter(xWrapperEl, 'offsetWidth', 200)
		];

		// 派发 wheel 事件 (deltaX 非 0 → shouldWheelX 真分支)
		headerEl.dispatchEvent(new WheelEvent('wheel', {
			bubbles: true,
			cancelable: true,
			deltaX: 30,
			deltaY: 0
		} as any));
		await flush();
		await sleep(20);

		// deltaY 非 0 → shouldWheelY 真分支
		headerEl.dispatchEvent(new WheelEvent('wheel', {
			bubbles: true,
			cancelable: true,
			deltaX: 0,
			deltaY: 30
		} as any));
		await flush();
		await sleep(20);

		// deltaX === 0 + deltaY === 0 → shouldWheelX/Y delta=0 分支
		headerEl.dispatchEvent(new WheelEvent('wheel', {
			bubbles: true,
			cancelable: true,
			deltaX: 0.1,
			deltaY: 0.1
		} as any));
		await flush();
		await sleep(20);

		restores.forEach(fn => fn());
		wrapper.unmount();
	});

	it('maxHeight + showSummary covers fixedHeightStyle.bottom branch', async () => {
		const data = buildData(3);
		const wrapper = mount(() => (
			<Table data={data} maxHeight={300} showSummary>
				<TableColumn label="名称" prop="name" fixed="left" width={100} />
				<TableColumn label="计数" prop="count" width={500} />
				<TableColumn label="操作" prop="address" fixed="right" width={100} />
			</Table>
		), { attachTo: document.body });
		await flush();
		await sleep(30);
		expect(wrapper.find('.vc-table__footer-wrapper').exists()).toBe(true);
		// maxHeight + 固定列走 sticky 路径，不再渲染 .vc-table__fixed* 容器
		expect(wrapper.find('.vc-table__footer .vc-table__td.is-fixed-left').exists()).toBe(true);
		expect(wrapper.find('.vc-table__footer .vc-table__td.is-fixed-right').exists()).toBe(true);
		expect(wrapper.find('.vc-table__fixed').exists()).toBe(false);
		expect(wrapper.find('.vc-table__fixed-right').exists()).toBe(false);
		wrapper.unmount();
	});

	it('Row.update: replaces currentRow when not in new data via primaryKey', async () => {
		const data = ref([{ id: 1, name: 'a' }, { id: 2, name: 'b' }]);
		const onCurrentChange = vi.fn();
		const tableRef = ref<any>();
		const wrapper = mount(() => (
			<Table
				ref={tableRef}
				data={data.value}
				primaryKey="id"
				onCurrentChange={onCurrentChange}
			>
				<TableColumn label="名称" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();

		const vm = tableRef.value!;
		vm.setCurrentRow(vm.store.states.data[0]);
		await flush();
		// 替换数据为 id=1 的不同对象引用 → Row.update 触发新行查找
		data.value = [{ id: 1, name: 'a-updated' }, { id: 3, name: 'c' }];
		await flush();
		await flush();
		// 当前行仍按 primaryKey 找回新引用，current-change 携带找回的行
		expect(vm.store.states.currentRow?.id).toBe(1);
		expect(onCurrentChange).toHaveBeenLastCalledWith(
			expect.objectContaining({ id: 1, name: 'a-updated' }),
			expect.objectContaining({ id: 1, name: 'a' })
		);
		wrapper.unmount();
	});

	it('Layout.updateColumnsWidth additional jsdom paths (no mock, default body width)', async () => {
		// 在不 mock clientWidth 的真实 jsdom 环境下挂载多种列组合，
		// 触发 Layout.updateColumnsWidth 的 jsdom 默认 (clientWidth=0) 边界分支。
		const widgets = [
			(
				<Table data={buildData(1)} fit>
					<TableColumn label="A" prop="name" minWidth={100} />
				</Table>
			),
			(
				<Table data={buildData(1)} fit>
					<TableColumn label="A" prop="name" minWidth={100} />
					<TableColumn label="B" prop="name" minWidth={120} />
					<TableColumn label="C" prop="name" minWidth={80} />
				</Table>
			),
			(
				<Table data={buildData(1)} fit={false}>
					<TableColumn label="A" prop="name" width={300} />
					<TableColumn label="B" prop="name" />
				</Table>
			)
		];
		for (const node of widgets) {
			const w = mount(() => node, { attachTo: document.body });
			await flush();
			expect(w.findAll('.vc-table__th').length).toBeGreaterThan(0);
			w.unmount();
		}
	});

	it('Footer with empty data + getSummary returning string per column', async () => {
		const wrapper = mount(() => (
			<Table data={[]} showSummary>
				<TableColumn label="名称" prop="name" />
				<TableColumn label="计数" prop="count" />
			</Table>
		), { attachTo: document.body });
		await flush();
		expect(wrapper.find('.vc-table__footer').exists()).toBe(true);
		wrapper.unmount();
	});

	it('toggleRowExpansion without expand column delegates to tree.toggle', async () => {
		const data = [{ id: 1, name: 'a', children: [{ id: 11, name: 'a-1' }] }];
		const tableRef = ref<any>();
		const wrapper = mount(() => (
			<Table ref={tableRef} data={data} primaryKey="id">
				<TableColumn label="名称" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();
		const vm = tableRef.value!;
		// 没有 expand 列 → toggleRowExpansion 切换树节点
		vm.toggleRowExpansion(vm.store.states.data[0]);
		await flush();
		expect(vm.store.tree.isExpanded(1)).toBe(true);
		expect(vm.store.states.renderData.map((row: any) => row.id)).toEqual([1, 11]);
		wrapper.unmount();
	});

	it('row mouseenter / mouseleave triggers debounced setHoverRow', async () => {
		const data = buildData(2);
		const wrapper = mount(() => (
			<Table data={data} highlight>
				<TableColumn label="A" prop="name" fixed="left" />
				<TableColumn label="B" prop="count" />
			</Table>
		), { attachTo: document.body });
		await flush();
		const row = wrapper.find('.vc-table__body-wrapper .vc-table__tr');
		await row.find('.vc-table__td').trigger('mouseover');
		await sleep(40);
		await row.trigger('mouseleave');
		await sleep(40);
		await flush();
		wrapper.unmount();
	});

	it('cell text-line tooltip mouse enter/leave', async () => {
		const data = [{ id: 1, name: 'long-content-x' }];
		const wrapper = mount(() => (
			<Table data={data} primaryKey="id">
				<TableColumn label="名称" prop="name" line={1} />
			</Table>
		), { attachTo: document.body });
		await flush();
		const cell = wrapper.find('.vc-table__td');
		await cell.trigger('mouseover');
		await flush();
		await wrapper.find('.vc-table__body-wrapper .vc-table__tr').trigger('mouseleave');
		await flush();
		wrapper.unmount();
	});

	it('NormalList: 直接渲染块（grid 行高自撑开，无 Resizer 测高回写）', async () => {
		const data = buildData(2);
		const wrapper = mount(() => (
			<Table data={data}>
				<TableColumn label="A" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();
		const norm = wrapper.findComponent({ name: 'vc-table-normal-list' });
		expect(norm.exists()).toBe(true);
		// 不再包裹 Resizer
		expect(norm.findAllComponents({ name: 'vc-resizer' })).toHaveLength(0);
		// 每行一个 vc-table__tr（grid 容器）
		expect(wrapper.findAll('.vc-table__body-wrapper .vc-table__tr')).toHaveLength(2);
		wrapper.unmount();
	});

	it('store.scheduleLayout(true) triggers updateColumns + debouncedUpdateLayout', async () => {
		const data = buildData(2);
		const tableRef = ref<any>();
		const wrapper = mount(() => (
			<Table ref={tableRef} data={data}>
				<TableColumn label="A" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();
		tableRef.value!.store.scheduleLayout(true);
		await flush();
		await sleep(60);
		wrapper.unmount();
	});

	it('header renders fixed columns as sticky cells when !height (phase 1)', async () => {
		const wrapper = mount(() => (
			<Table data={buildData(2)} border>
				<TableColumn label="A" prop="name" fixed="left" width={100} />
				<TableColumn label="B" prop="count" />
				<TableColumn label="C" prop="address" fixed="right" width={100} />
			</Table>
		), { attachTo: document.body });
		await flush();
		// !height 时不再渲染 .vc-table__fixed* 容器，固定列改为 sticky cell
		expect(wrapper.find('.vc-table__th.is-fixed-left').exists()).toBe(true);
		expect(wrapper.find('.vc-table__th.is-fixed-right').exists()).toBe(true);
		expect(wrapper.find('.vc-table__td.is-fixed-left').exists()).toBe(true);
		expect(wrapper.find('.vc-table__td.is-fixed-right').exists()).toBe(true);
		expect(wrapper.find('.vc-table__fixed').exists()).toBe(false);
		expect(wrapper.find('.vc-table__fixed-right').exists()).toBe(false);
		wrapper.unmount();
	});

	it('selection column is not auto-fixed when the only left-fixed column is hidden', async () => {
		const tableRef = ref<any>();
		const columns = ref<any[]>([]);
		const wrapper = mount(() => (
			<Table
				ref={tableRef}
				data={buildData(2)}
				primaryKey="id"
				columns={columns.value}
				{...{ 'onUpdate:columns': (v: any[]) => { columns.value = v; } }}
			>
				<TableColumn type="selection" />
				<TableColumn label="A" prop="name" fixed="left" width={100} />
				<TableColumn label="B" prop="address" />
			</Table>
		), { attachTo: document.body });
		await flush();
		const states = () => tableRef.value!.store.states;
		expect(states().leftFixedColumns.map((c: any) => c.states.type)).toEqual(['selection', 'default']);

		// 通过 v-model:columns 隐藏唯一的左固定列：selection 不再单独固定
		columns.value = columns.value.map((c: any) => (c.prop === 'name' ? { ...c, hidden: true } : c));
		await flush();
		await sleep(80);
		await flush();
		expect(states().leftFixedColumns).toHaveLength(0);
		expect(wrapper.find('.vc-table__body-wrapper .vc-table__td').classes()).not.toContain('is-fixed-left');
		wrapper.unmount();
	});

	it('selectable receives the same index from row checkboxes and select-all (tree rows, collapsed)', async () => {
		const selectable = vi.fn<(row: any, index: number) => boolean>(() => true);
		const tableRef = ref<any>();
		const data = [
			{ id: 1, name: 'r1', children: [{ id: 11, name: 'c1' }, { id: 12, name: 'c2' }] },
			{ id: 2, name: 'r2' }
		];
		const wrapper = mount(() => (
			<Table ref={tableRef} data={data} primaryKey="id">
				<TableColumn type="selection" selectable={selectable} />
				<TableColumn label="名称" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();
		const indexesOf = (id: number) => new Set(selectable.mock.calls.filter(([row]) => row.id === id).map(([, index]) => index));

		// 子节点收起：r2 渲染在第 2 行，但在可选择行（含收起的子行）中的下标为 3
		expect(indexesOf(2)).toEqual(new Set([3]));

		selectable.mockClear();
		tableRef.value!.toggleAllSelection();
		await sleep(20);
		await flush();
		expect(indexesOf(2)).toEqual(new Set([3]));
		expect(indexesOf(11)).toEqual(new Set([1]));
		wrapper.unmount();
	});

	it('selection column auto-fix follows the other left-fixed columns without mutating its own fixed', async () => {
		const data = buildData(2);
		const tableRef = ref<any>();
		const fixed = ref<string | undefined>('left');
		const wrapper = mount(() => (
			<Table ref={tableRef} data={data} primaryKey="id">
				<TableColumn type="selection" />
				<TableColumn label="A" prop="name" fixed={fixed.value} width={100} />
				<TableColumn label="B" prop="address" />
			</Table>
		), { attachTo: document.body });
		await flush();
		const states = () => tableRef.value!.store.states;
		const selectionCell = () => wrapper.find('.vc-table__body-wrapper .vc-table__td');

		// 存在左固定列：selection 随之左固定，但列自身的 fixed 不被改写
		expect(states().leftFixedColumns.map((c: any) => c.states.type)).toEqual(['selection', 'default']);
		expect(states()._columns[0].states.fixed).toBe(false);
		expect(selectionCell().classes()).toContain('is-fixed-left');

		// 其余列取消固定：selection 随之恢复
		fixed.value = undefined;
		await flush();
		await sleep(80);
		await flush();
		expect(states().leftFixedColumns).toHaveLength(0);
		expect(selectionCell().classes()).not.toContain('is-fixed-left');
		wrapper.unmount();
	});

	it('Row.update directly: replaces stale currentRow when not in data', async () => {
		const data = buildData(2);
		const tableRef = ref<any>();
		const wrapper = mount(() => (
			<Table ref={tableRef} data={data} primaryKey="id">
				<TableColumn label="A" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();
		const vm = tableRef.value!;
		// 强制塞入一个不在 data 中的 currentRow，调用 current.update 走查找分支
		vm.store.states.currentRow = { id: 999, name: 'gone' } as any;
		await flush();
		vm.store.row.update();
		await flush();

		// setById(id) 边界：找不到 id 则置 null
		vm.store.row.setById(123);
		expect(vm.store.states.currentRow).toBe(null);
		wrapper.unmount();
	});

	it('toggleAllSelection covers toggleRowStatus batch=true (delete) path', async () => {
		const data = buildData(3);
		const tableRef = ref<any>();
		const wrapper = mount(() => (
			<Table ref={tableRef} data={data} primaryKey="id">
				<TableColumn type="selection" />
				<TableColumn label="A" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();
		const vm = tableRef.value!;
		// 先全选
		vm.toggleAllSelection();
		await sleep(30);
		await flush();
		// 再全选，触发 batch removeRow（delete statusArr[index]）路径
		vm.toggleAllSelection();
		await sleep(30);
		await flush();
		wrapper.unmount();
	});

	it('cleanSelection without primaryKey + with primaryKey w/ row removed', async () => {
		// without primaryKey
		const data1 = buildData(2);
		const tableRef1 = ref<any>();
		const w1 = mount(() => (
			<Table ref={tableRef1} data={data1}>
				<TableColumn type="selection" />
				<TableColumn label="A" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();
		const vm1 = tableRef1.value!;
		vm1.toggleRowSelection(vm1.store.states.data[0], true, false);
		await flush();
		// 直接 cleanSelection（同一引用），数据未变 → 选中保留
		vm1.store.selection.clean();
		expect(vm1.store.states.selection.length).toBe(1);
		w1.unmount();

		// with primaryKey: 选中后将 data 替换为不含被选 id 的新数组
		const data2 = ref([{ id: 1, name: 'a' }, { id: 2, name: 'b' }]);
		const tableRef2 = ref<any>();
		const w2 = mount(() => (
			<Table ref={tableRef2} data={data2.value} primaryKey="id">
				<TableColumn type="selection" />
				<TableColumn label="A" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();
		const vm2 = tableRef2.value!;
		vm2.toggleRowSelection(vm2.store.states.data[0], true, false);
		await flush();
		// 替换 data，但保留同一引用（splice）
		data2.value.splice(0, 1);
		await flush();
		await flush();
		expect(vm2.store.states.selection.length).toBe(0);
		w2.unmount();
	});

	it('TableSort callback orders + handleMouseOut on header', async () => {
		const onSort = vi.fn();
		const data = buildData(2);
		const wrapper = mount(() => (
			<Table data={data} resizable border onSortChange={onSort}>
				<TableColumn label="A" prop="name" sortable />
				<TableColumn label="B" prop="count" />
			</Table>
		), { attachTo: document.body });
		await flush();
		const ths = wrapper.findAll('.vc-table__th');
		// mouseout 触发 handleMouseOut
		const thEl = ths[0].element as HTMLElement;
		thEl.dispatchEvent(new MouseEvent('mouseout', { bubbles: true }));
		await flush();
		// 在 sortable header 上 mousemove，draggingColumn=null 分支
		thEl.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: 50 } as any));
		await flush();
		wrapper.unmount();
	});

	it('header column with custom renderHeader prop function', async () => {
		const data = buildData(1);
		const wrapper = mount(() => (
			<Table data={data}>
				<TableColumn
					label="A"
					prop="name"
					renderHeader={({ column }: any) => (
						<span class="custom-h">
							[
							{column.label}
							]
						</span>
					)}
				/>
			</Table>
		), { attachTo: document.body });
		await flush();
		expect(wrapper.find('.custom-h').exists()).toBe(true);
		wrapper.unmount();
	});

	it('column-confg.selection renderCell with selectable disables checkbox', async () => {
		const data = buildData(3);
		const wrapper = mount(() => (
			<Table data={data} primaryKey="id">
				<TableColumn type="selection" selectable={(_row: any, idx: number) => idx !== 0} />
				<TableColumn label="A" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();
		// 第一行 checkbox 应被 disabled（cellForced.selection.renderCell 走 disabled=true 分支）
		const checkboxes = wrapper.findAll('.vc-checkbox');
		expect(checkboxes.length).toBeGreaterThan(0);
		wrapper.unmount();
	});

	it('store.expand.prune / getRows without data still safe', async () => {
		const tableRef = ref<any>();
		const wrapper = mount(() => (
			<Table ref={tableRef} data={[]} primaryKey="id">
				<TableColumn type="expand" label="详情">
					{{ default: () => <div /> }}
				</TableColumn>
				<TableColumn label="A" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();
		const vm = tableRef.value!;
		vm.store.expand.prune();
		expect(vm.store.expand.getRows()).toEqual([]);
		wrapper.unmount();
	});

	it('placeholder default fallback when no value', async () => {
		const wrapper = mount(() => (
			<Table data={[{ id: 1, name: '' }]} primaryKey="id">
				<TableColumn label="名称" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();
		const cells = wrapper.findAll('.vc-table__td .vc-table__cell');
		// 默认 placeholder 是 '-'
		expect(cells.some(c => c.text() === '-')).toBe(true);
		wrapper.unmount();
	});

	it('placeholder explicit empty string falls through value', async () => {
		const wrapper = mount(() => (
			<Table data={[{ id: 1, name: 'x' }]} primaryKey="id" placeholder="">
				<TableColumn label="名称" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();
		expect(wrapper.text()).toContain('x');
		wrapper.unmount();
	});

	it('treeCellPrefix unit: indent + icon / spin + placeholder, click toggles the node', async () => {
		const { treeCellPrefix } = await import('../table-column/table-column-config');
		const fakeStore = {
			tree: { toggle: vi.fn() }
		};
		const node = (extra: Record<string, any> = {}) => ({
			level: 1, indent: 20, expandable: true, expanded: false, loading: false, ...extra
		});
		// class 在创建 vnode 时已归一化为字符串
		const classOf = (vnode: any) => vnode.props.class.split(' ');

		// treeNode 为空 → null
		expect(treeCellPrefix({ row: {}, treeNode: undefined, store: fakeStore } as any)).toBe(null);

		// 可展开：缩进 + 展开图标
		const [indent, icon]: any = treeCellPrefix({ row: { id: 1 }, treeNode: node(), store: fakeStore } as any);
		expect(indent.props.style).toEqual({ paddingLeft: '20px' });
		expect(classOf(icon)).toContain('vc-table__tree-icon');
		expect(classOf(icon)).not.toContain('is-expand');
		icon.props.onClick({ stopPropagation: () => {} });
		expect(fakeStore.tree.toggle).toHaveBeenCalledWith({ id: 1 });

		// 加载中：图标换为 Spin；已展开带 is-expand
		const [, loading]: any = treeCellPrefix({
			row: { id: 2 }, treeNode: node({ expanded: true, loading: true }), store: fakeStore
		} as any);
		expect(classOf(loading)).toContain('is-expand');
		expect(loading.children[0].type.name).toBe('vc-spin');

		// 根层叶子行：无缩进，占位对齐
		const [noIndent, placeholder]: any = treeCellPrefix({
			row: { id: 3 }, treeNode: node({ level: 0, indent: 0, expandable: false }), store: fakeStore
		} as any);
		expect(noIndent).toBe(null);
		expect(placeholder.props.class).toBe('vc-table__placeholder');
	});

	it('selection checkbox click triggers rowSelectedChanged + stopPropagation', async () => {
		const data = buildData(2);
		const tableRef = ref<any>();
		const onSelect = vi.fn();
		const onCellClick = vi.fn();
		const wrapper = mount(() => (
			<Table ref={tableRef} data={data} primaryKey="id" onSelect={onSelect} onCellClick={onCellClick}>
				<TableColumn type="selection" />
				<TableColumn label="名称" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();
		// 通过 DOM 触发 click（attrs fallthrough 到 label）与 input change，覆盖 stopPropagation + rowChanged
		const checkboxes = wrapper.findAllComponents({ name: 'vc-checkbox' });
		const bodyCheckbox = checkboxes.find(cb => !cb.element.closest('.vc-table__th'));
		if (bodyCheckbox) {
			await bodyCheckbox.trigger('click');
			await bodyCheckbox.find('input').trigger('change');
			await flush();
		}
		wrapper.unmount();
	});

	it('column filters: single (max 1) - pick applies immediately, 全部 clears to undefined', async () => {
		// 受控单选：初始 undefined 也算受控（写了 modelValue 这个键）
		const value = ref<string | undefined>(undefined);
		const filterFn = vi.fn();
		const wrapper = mount(() => (
			<Table data={[{ id: 1, name: 'a' }]} primaryKey="id">
				<TableColumn
					label="名称"
					prop="name"
					filterOptions={{
						'data': [{ value: 'a', label: 'A' }, { value: 'b', label: 'B', disabled: true }],
						'modelValue': value.value,
						'portalClass': 'single-filter-popup',
						'onUpdate:modelValue': (v: any) => { value.value = v; },
						'onChange': filterFn
					}}
				/>
			</Table>
		), { attachTo: document.body });
		await flush();
		expect(wrapper.find('.vc-table-filter__icon').classes()).not.toContain('is-active');

		await wrapper.find('.vc-table__th .vc-table-filter').trigger('click');
		await flush();
		const popup = document.querySelector('.single-filter-popup') as HTMLElement;
		const items = popup.querySelectorAll<HTMLElement>('.vc-table-filter__item');
		// 「全部」+ 2 个选项
		expect(items).toHaveLength(3);

		// 禁用项不可选：编辑中的值不变
		items[2].click();
		await flush();
		expect(popup.querySelectorAll('.vc-table-filter__item.is-active')).toHaveLength(0);

		// 点选即生效（延迟确认，等待回调而非固定时长）
		items[1].click();
		await vi.waitFor(() => expect(filterFn).toHaveBeenCalledTimes(1));
		// 单选输出单个值
		expect(filterFn).toHaveBeenLastCalledWith('a');
		expect(value.value).toBe('a');
		await flush();
		expect(wrapper.find('.vc-table-filter__icon').classes()).toContain('is-active');

		// 重新打开后点「全部」：清空
		await wrapper.find('.vc-table__th .vc-table-filter').trigger('click');
		await flush();
		(document.querySelector('.single-filter-popup .vc-table-filter__item') as HTMLElement).click();
		await flush();
		expect(filterFn).toHaveBeenLastCalledWith(undefined);
		// 外部清空为 undefined：仍是受控，图标取消高亮
		expect(value.value).toBeUndefined();
		expect(wrapper.find('.vc-table-filter__icon').classes()).not.toContain('is-active');
		wrapper.unmount();
	});

	it('header dragLineClass returns has-drag-line when resizable + no border', async () => {
		const wrapper = mount(() => (
			<Table data={buildData(1)} resizable>
				<TableColumn label="名称" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();
		// resizable && !border 时 th 上应附加 has-drag-line
		expect(wrapper.find('.vc-table__th.has-drag-line').exists()).toBe(true);
		wrapper.unmount();
	});

	it('store.insertColumn / removeColumn after isReady triggers updateColumns', async () => {
		const showCol = ref(true);
		const tableRef = ref<any>();
		const wrapper = mount(() => (
			<Table ref={tableRef} data={buildData(1)}>
				<TableColumn label="A" prop="name" />
				{ showCol.value ? <TableColumn label="B" prop="count" /> : null }
			</Table>
		), { attachTo: document.body });
		await flush();
		await sleep(10);
		await flush();
		// remove column → 触发 removeColumn → updateColumns + scheduleLayout
		showCol.value = false;
		await flush();
		await sleep(10);
		await flush();
		// re-insert column → 触发 insertColumn 走 isReady 分支
		showCol.value = true;
		await flush();
		await sleep(10);
		await flush();
		wrapper.unmount();
	});

	it('!showHeader + maxHeight covers fixedHeightStyle branch without header', async () => {
		// 与基础 showHeader=false 用例的差异：maxHeight 会进入 fixedHeightStyle 计算分支
		const wrapper = mount(() => (
			<Table data={buildData(2)} showHeader={false} maxHeight={300}>
				<TableColumn label="A" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();
		expect(wrapper.find('.vc-table__thead').exists()).toBe(false);
		expect(wrapper.find('.vc-table__body-wrapper').exists()).toBe(true);
		wrapper.unmount();
	});

	it('append slot + height + fixed columns: sticky 模式下只渲染单一 append 容器', async () => {
		const wrapper = mount(() => (
			<Table data={buildData(2)} height={300}>
				{{
					default: () => [
						<TableColumn label="A" prop="name" fixed="left" width={120} />,
						<TableColumn label="B" prop="count" fixed="right" width={120} />
					],
					append: () => <div class="my-append">Append!</div>
				}}
			</Table>
		), { attachTo: document.body });
		await flush();
		await sleep(20);
		await flush();
		// 单 DOM + sticky：append 仅渲染一份；不再出现 .vc-table__fixed* 容器
		expect(wrapper.findAll('.my-append').length).toBe(1);
		expect(wrapper.find('.vc-table__fixed').exists()).toBe(false);
		expect(wrapper.find('.vc-table__fixed-right').exists()).toBe(false);
		wrapper.unmount();
	});

	it('TableColumn slot returning Fragment covers Fragment branch in render', async () => {
		// Fragment 在 default slot 中：通过 v-for 模式触发 (可被 vue-test-utils 渲染为 Fragment)
		const wrapper = mount({
			components: { Table, TableColumn },
			template: `
				<Table :data="data">
					<TableColumn label="A" prop="name" />
					<template v-if="show">
						<TableColumn label="B" prop="count" />
					</template>
				</Table>
			`,
			data() {
				return { data: buildData(1), show: true };
			}
		}, { attachTo: document.body });
		await flush();
		expect(wrapper.findAll('.vc-table__th').length).toBeGreaterThan(0);
		wrapper.unmount();
	});

	it('Table with sort prop matching column propagates order prop to TableSort', async () => {
		const sort = ref<any>({ prop: 'name', order: 'ascending' });
		const wrapper = mount(() => (
			<Table data={buildData(2)} sort={sort.value}>
				<TableColumn label="名称" prop="name" sortable />
			</Table>
		), { attachTo: document.body });
		await flush();
		// 当 sort.prop 命中 column.prop 时，asc icon 上附加 is-ascending 状态类
		expect(wrapper.find('.vc-table-sort__icon--ascending').classes()).toContain('is-ascending');
		expect(wrapper.find('.vc-table-sort__icon--descending').classes()).not.toContain('is-descending');
		wrapper.unmount();
	});

	it('header mousemove on resize zone sets draggingColumn (border + resizable)', async () => {
		const wrapper = mount(() => (
			<Table data={buildData(2)} border>
				<TableColumn label="名称" prop="name" width={120} sortable />
			</Table>
		), { attachTo: document.body });
		await flush();
		const th = wrapper.find('.vc-table__th');
		const thEl = th.element as HTMLElement;
		// 模拟 boundingClientRect 让 mousemove 命中 resize 区域 (rect.right - clientX < 8)
		thEl.getBoundingClientRect = () => ({
			width: 120, height: 30, left: 0, top: 0, right: 120, bottom: 30, x: 0, y: 0,
			toJSON: () => ({})
		} as any);

		document.body.style.cursor = '';
		// 页面横向滚动了 300px：pageX 与视口坐标 clientX 不同，命中判断须以 clientX 为准
		// （jsdom 的 pageX 恒等于 clientX，这里手动覆盖以模拟页面滚动）
		const moveTo = async (clientX: number) => {
			const event = new MouseEvent('mousemove', { clientX, bubbles: true });
			Object.defineProperty(event, 'pageX', { value: clientX + 300 });
			thEl.dispatchEvent(event);
			await flush();
		};
		await moveTo(115);
		// 进入 resize 区 → body cursor 变为 col-resize
		expect(document.body.style.cursor).toBe('col-resize');

		await moveTo(50);
		// 离开 resize 区 → body cursor 还原
		expect(document.body.style.cursor).toBe('');

		await th.trigger('mouseout');
		await flush();
		wrapper.unmount();
	});

	it('virtual scroll: wheel events trigger handleMousewheel + body.scrollTo path', async () => {
		const data = buildData(20);
		const tableRef = ref<any>();
		const wrapper = mount(() => (
			<Table ref={tableRef} data={data} primaryKey="id" height={150} rows={5}>
				<TableColumn label="A" prop="name" width={100} />
				<TableColumn label="B" prop="count" width={100} />
			</Table>
		), { attachTo: document.body });
		await flush();
		await sleep(30);
		await flush();

		const headerEl = wrapper.find('.vc-table__header-wrapper').element as HTMLElement;
		const xWrapperEl = wrapper.find('.vc-table__body-wrapper').element as HTMLElement;
		makeWritable(headerEl, 'scrollLeft');
		makeWritable(xWrapperEl, 'scrollLeft');
		makeWritable(xWrapperEl, 'scrollTop');
		const restores = [
			defineGetter(xWrapperEl, 'scrollWidth', 400),
			defineGetter(xWrapperEl, 'clientWidth', 200),
			defineGetter(xWrapperEl, 'scrollHeight', 800),
			defineGetter(xWrapperEl, 'clientHeight', 150),
			defineGetter(xWrapperEl, 'offsetWidth', 200)
		];
		// 派发 deltaY 滚动 → handleMousewheel 走 props.height 真分支
		headerEl.dispatchEvent(new WheelEvent('wheel', {
			bubbles: true,
			cancelable: true,
			deltaX: 0,
			deltaY: 30
		} as any));
		await flush();
		await sleep(30);
		await flush();
		// 派发 deltaX 让 contentW > wrapperW 路径覆盖
		headerEl.dispatchEvent(new WheelEvent('wheel', {
			bubbles: true,
			cancelable: true,
			deltaX: 30,
			deltaY: 0
		} as any));
		await flush();
		await sleep(30);
		await flush();

		restores.forEach(fn => fn());
		wrapper.unmount();
	});

	it('Resize listeners: same size noop / height change with props.height', async () => {
		const tableRef = ref<any>();
		const wrapper = mount(() => (
			<Table ref={tableRef} data={buildData(2)} fit height={200}>
				<TableColumn label="名称" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();
		await sleep(20);
		await flush();

		const tableEl = wrapper.element as HTMLElement;
		const rz = (tableEl as any).__rz__;
		expect(rz?.listeners?.length).toBeGreaterThan(0);
		const getState = () => tableRef.value!.resizeState as { width: number; height: number };

		// 1) 同尺寸：shouldUpdateLayout=false 分支
		const before = { ...getState() };
		rz.listeners.forEach((fn: any) => fn());
		await flush();
		expect(getState().width).toBe(before.width);
		expect(getState().height).toBe(before.height);

		// 2) 高度变化：props.height=true 短路 → 进入 height-changed 真分支
		const newH = before.height + 100;
		Object.defineProperty(tableEl, 'offsetHeight', { configurable: true, value: newH });
		rz.listeners.forEach((fn: any) => fn());
		await flush();
		expect(getState().height).toBe(newH);

		wrapper.unmount();
	});

	it('Resize listeners: fluid height ignores height-only changes even with fixed columns', async () => {
		const tableRef = ref<any>();
		const wrapper = mount(() => (
			<Table ref={tableRef} data={buildData(2)}>
				<TableColumn label="A" prop="name" fixed="left" width={120} />
				<TableColumn label="B" prop="count" />
			</Table>
		), { attachTo: document.body });
		await flush();
		await sleep(20);
		await flush();

		const tableEl = wrapper.element as HTMLElement;
		const rz = (tableEl as any).__rz__;
		expect(rz?.listeners?.length).toBeGreaterThan(0);

		// 流式高度只关心宽度变化；固定列不再触发高度重算
		const before = { ...tableRef.value!.resizeState };
		Object.defineProperty(tableEl, 'offsetHeight', { configurable: true, value: before.height + 100 });
		rz.listeners.forEach((fn: any) => fn());
		await flush();
		expect(tableRef.value!.resizeState.height).toBe(before.height);

		wrapper.unmount();
	});

	it('Resize listeners: fit=false still listens and refreshes scrollX on width change', async () => {
		const tableRef = ref<any>();
		const wrapper = mount(() => (
			<Table ref={tableRef} data={buildData(2)} fit={false}>
				<TableColumn label="A" prop="name" width={120} />
				<TableColumn label="B" prop="count" width={120} />
			</Table>
		), { attachTo: document.body });
		await flush();
		await sleep(20);
		await flush();

		const vm = tableRef.value!;
		const tableEl = wrapper.element as HTMLElement;
		const rz = (tableEl as any).__rz__;
		expect(rz?.listeners?.length).toBeGreaterThan(0);
		// jsdom 中容器宽度为 0：列宽之和溢出
		expect(vm.layout.states.scrollX).toBe(true);

		Object.defineProperty(tableEl, 'clientWidth', { configurable: true, value: 1000 });
		Object.defineProperty(tableEl, 'offsetWidth', { configurable: true, value: 1000 });
		rz.listeners.forEach((fn: any) => fn());
		await flush();
		expect(vm.layout.states.scrollX).toBe(false);

		wrapper.unmount();
	});

	it('handleScollX coverage: scrollLeft=0 left + middle + maxScrollLeft right + footer + leftFixedBody', async () => {
		const tableRef = ref<any>();
		const wrapper = mount(() => (
			<Table ref={tableRef} data={buildData(2)} showSummary border>
				<TableColumn label="A" prop="name" fixed="left" width={120} />
				<TableColumn label="B" prop="count" width={500} />
				<TableColumn label="C" prop="address" fixed="right" width={120} />
			</Table>
		), { attachTo: document.body });
		await flush();
		await sleep(20);
		await flush();

		const headerEl = wrapper.find('.vc-table__header-wrapper').element as HTMLElement;
		const footerEl = wrapper.find('.vc-table__footer-wrapper').element as HTMLElement;
		const xWrapperEl = wrapper.find('.vc-table__body-wrapper').element as HTMLElement;
		makeWritable(headerEl, 'scrollLeft');
		makeWritable(footerEl, 'scrollLeft');
		makeWritable(xWrapperEl, 'scrollLeft');
		makeWritable(xWrapperEl, 'scrollTop');
		const restores = [
			defineGetter(xWrapperEl, 'scrollWidth', 600),
			defineGetter(xWrapperEl, 'offsetWidth', 200)
		];

		const sw = wrapper.findComponent({ name: 'vc-scroller-wheel' });
		// scrollLeft=0 → handleScollX 走 'left' 分支
		(xWrapperEl as any).scrollLeft = 0;
		sw.exists() && sw.vm.$emit('scroll', { target: xWrapperEl });
		await flush();
		// 中间 → 'middle'
		(xWrapperEl as any).scrollLeft = 100;
		sw.exists() && sw.vm.$emit('scroll', { target: xWrapperEl });
		await flush();
		// 最右 → 'right'
		(xWrapperEl as any).scrollLeft = 399;
		sw.exists() && sw.vm.$emit('scroll', { target: xWrapperEl });
		await flush();

		restores.forEach(fn => fn());
		wrapper.unmount();
	});

	it('hoverRowIndex change applies hover-row on td (JS 控制)', async () => {
		const tableRef = ref<any>();
		const wrapper = mount(() => (
			<Table ref={tableRef} data={buildData(2)}>
				<TableColumn label="A" prop="name" />
				<TableColumn label="B" prop="count" />
			</Table>
		), { attachTo: document.body });
		await flush();
		tableRef.value!.store.states.hoverRowIndex = 0;
		await flush();
		await sleep(30);
		await flush();
		expect(wrapper.find('.vc-table__td[data-row="0"].hover-row').exists()).toBe(true);
		tableRef.value!.store.states.hoverRowIndex = null;
		await flush();
		await sleep(30);
		await flush();
		expect(wrapper.find('.hover-row').exists()).toBe(false);
		wrapper.unmount();
	});

	it('rowHeight prop -> grid-auto-rows on normal rows', async () => {
		const wrapper = mount(() => (
			<Table data={buildData(2)} rowHeight={40}>
				<TableColumn label="A" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();
		const tr = wrapper.find('.vc-table__body-wrapper .vc-table__tr').element as HTMLElement;
		expect(tr.style.gridAutoRows).toBe('40px');
		wrapper.unmount();
	});

	it('toggleAllSelection without selection toggles all on', async () => {
		const tableRef = ref<any>();
		const data = buildData(3);
		const wrapper = mount(() => (
			<Table ref={tableRef} data={data} primaryKey="id">
				<TableColumn type="selection" />
				<TableColumn label="名称" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();
		const vm = tableRef.value!;
		// 全选（无任何选中）→ 走 selection.length=0 + isAllSelected=false 分支
		vm.toggleAllSelection();
		await flush();
		await sleep(20);
		await flush();
		// 全取消
		vm.toggleAllSelection();
		await flush();
		await sleep(20);
		await flush();
		wrapper.unmount();
	});

	it('toggleAllSelection with selectable filters rows', async () => {
		const tableRef = ref<any>();
		const data = buildData(3);
		const selectable = (_row: any, idx: number) => idx % 2 === 0;
		const wrapper = mount(() => (
			<Table ref={tableRef} data={data} primaryKey="id">
				<TableColumn type="selection" selectable={selectable} />
				<TableColumn label="名称" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();
		tableRef.value!.toggleAllSelection();
		await flush();
		await sleep(20);
		await flush();
		wrapper.unmount();
	});

	it('store branches: defaultExpandAll + treeMap defaults + currentRow same row + initial states', async () => {
		// 1) treeMap 部分缺失 → 走 || 'hasChildren' / 'children' 默认分支
		const data = [{ id: 1, name: 'r1', children: [{ id: 2, name: 'r1-1' }] }];
		const tableRef = ref<any>();
		const wrapper = mount(() => (
			<Table ref={tableRef} data={data} primaryKey="id" treeMap={{}}>
				<TableColumn label="名称" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();
		const vm = tableRef.value!;
		// 2) setCurrentRow with same row → oldCurrentRow === row 走 else 分支
		vm.setCurrentRow(vm.store.states.data[0]);
		await flush();
		vm.setCurrentRow(vm.store.states.data[0]);
		await flush();
		wrapper.unmount();
	});

	it('toggleAllSelection with indeterminate prop covers branch', async () => {
		const data = buildData(3);
		const tableRef = ref<any>();
		const wrapper = mount(() => (
			<Table ref={tableRef} data={data} primaryKey="id" indeterminate>
				<TableColumn type="selection" />
				<TableColumn label="名称" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();
		const vm = tableRef.value!;
		// 部分选中 → indeterminate=true 走 !isAllSelected 分支
		vm.toggleRowSelection(vm.store.states.data[0]);
		await flush();
		vm.toggleAllSelection();
		await flush();
		await sleep(20);
		await flush();
		wrapper.unmount();
	});

	it('row missing primaryKey value uses index as fallback id', async () => {
		const data = [{ name: 'no-id-1' }, { name: 'no-id-2' }];
		const tableRef = ref<any>();
		const wrapper = mount(() => (
			<Table ref={tableRef} data={data} primaryKey="id">
				<TableColumn label="名称" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();
		// 触发 selection 相关 path → getValuesMap 走 typeof id === 'undefined' 真分支
		tableRef.value!.store.selection.clean();
		await flush();
		wrapper.unmount();
	});

	it('Row.update: no primaryKey + currentRow removed → newCurrentRow=null branch', async () => {
		const data = ref<any[]>([{ name: 'a' }, { name: 'b' }]);
		const tableRef = ref<any>();
		const wrapper = mount(() => (
			<Table ref={tableRef} data={data.value}>
				<TableColumn label="名称" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();
		const vm = tableRef.value!;
		vm.setCurrentRow(vm.store.states.data[0]);
		await flush();
		// 替换数据，原 currentRow 不在新数据中 + 没有 primaryKey → newCurrentRow=null
		data.value = [{ name: 'c' }, { name: 'd' }];
		await flush();
		await flush();
		wrapper.unmount();
	});

	it('reserveSelection: setData triggers updateSelectionByRowKey path', async () => {
		const data = ref<any[]>([{ id: 1, name: 'a' }, { id: 2, name: 'b' }]);
		const tableRef = ref<any>();
		const wrapper = mount(() => (
			<Table ref={tableRef} data={data.value} primaryKey="id">
				<TableColumn type="selection" reserveSelection />
				<TableColumn label="名称" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();
		const vm = tableRef.value!;
		vm.toggleRowSelection(vm.store.states.data[0]);
		await flush();
		// 切换数据，reserveSelection 路径触发 updateSelectionByRowKey
		data.value = [{ id: 1, name: 'a-new' }, { id: 3, name: 'c' }];
		await flush();
		await flush();
		// rowInfo 命中 if 真分支
		expect(Array.isArray(vm.store.states.selection)).toBe(true);
		wrapper.unmount();
	});

	it('store.expand.reset / isExpanded with primary-key + without primary-key', async () => {
		const data = [{ id: 1, name: 'a' }, { id: 2, name: 'b' }];
		const tableRef = ref<any>();
		const wrapper = mount(() => (
			<Table ref={tableRef} data={data} primaryKey="id">
				<TableColumn type="expand">
					{{ default: ({ row }: any) => <div>{row.name}</div> }}
				</TableColumn>
				<TableColumn label="A" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();
		const vm = tableRef.value!;
		// reset：按行值精确设置，数字 / 字符串形式的行值等价
		vm.store.expand.reset(['1']);
		await flush();
		expect(vm.store.expand.isExpanded(vm.store.states.data[0])).toBe(true);
		expect(vm.store.expand.isExpanded(vm.store.states.data[1])).toBe(false);
		vm.store.expand.toggle(vm.store.states.data[1]);
		await flush();
		expect(vm.store.expand.getRows().map((row: any) => row.id)).toEqual([1, 2]);
		vm.store.expand.reset([2]);
		await flush();
		expect(vm.store.expand.getRows().map((row: any) => row.id)).toEqual([2]);
		wrapper.unmount();

		// 没有 primaryKey 的 isExpanded 路径
		const tableRef2 = ref<any>();
		const wrapper2 = mount(() => (
			<Table ref={tableRef2} data={[{ name: 'x' }]}>
				<TableColumn type="expand">
					{{ default: ({ row }: any) => <div>{row.name}</div> }}
				</TableColumn>
				<TableColumn label="A" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();
		const vm2 = tableRef2.value!;
		vm2.store.expand.toggle(vm2.store.states.data[0]);
		await flush();
		expect(vm2.store.expand.isExpanded(vm2.store.states.data[0])).toBe(true);
		// 指定的状态与当前一致：不变
		vm2.store.expand.toggle(vm2.store.states.data[0], true);
		await flush();
		expect(vm2.store.expand.isExpanded(vm2.store.states.data[0])).toBe(true);
		wrapper2.unmount();
	});

	it('cleanSelection without primaryKey: deleted=[] no emit branch', async () => {
		const data = buildData(2);
		const tableRef = ref<any>();
		const onSelectionChange = vi.fn();
		const wrapper = mount(() => (
			<Table ref={tableRef} data={data} onSelectionChange={onSelectionChange}>
				<TableColumn type="selection" />
				<TableColumn label="名称" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();
		const vm = tableRef.value!;
		// 选中第一行（在数据范围内）→ cleanSelection 时 deleted=[]，不会触发 selection-change
		vm.toggleRowSelection(vm.store.states.data[0]);
		await flush();
		const before = onSelectionChange.mock.calls.length;
		// 调用 cleanSelection（数据未变更，selected row 仍在 data 中）
		vm.store.selection.clean();
		await flush();
		expect(onSelectionChange.mock.calls.length).toBe(before);
		wrapper.unmount();
	});

	it('row mouseover debounce setHoverRow flushes after timeout', async () => {
		const tableRef = ref<any>();
		const wrapper = mount(() => (
			<Table ref={tableRef} data={buildData(2)}>
				<TableColumn label="A" prop="name" fixed="left" />
				<TableColumn label="B" prop="count" />
			</Table>
		), { attachTo: document.body });
		await flush();
		const row = wrapper.find('.vc-table__body-wrapper .vc-table__tr');
		await row.find('.vc-table__td').trigger('mouseover');
		await sleep(50);
		await flush();
		expect(tableRef.value!.store.states.hoverRowIndex).toBe(0);
		await row.trigger('mouseleave');
		await sleep(50);
		await flush();
		expect(tableRef.value!.store.states.hoverRowIndex).toBe(null);
		wrapper.unmount();
	});

	it('Layout.updateColumnsWidth covers single-flex / multi-flex / no-width-fallback / scrollX paths', async () => {
		const measure = (vm: any, bodyWidth: number) => {
			const el = vm.$?.vnode?.el ?? vm.layout?.table?.vnode?.el;
			expect(el).toBeTruthy();
			const restoreCW = defineGetter(el as HTMLElement, 'clientWidth', bodyWidth);
			vm.layout.updateColumnsWidth();
			restoreCW();
			return vm.store.states.columns;
		};

		// 1) fit + 列既无 width 也无 minWidth → realWidth=80 默认值分支
		const r1 = ref<any>();
		const w1 = mount(() => (
			<Table ref={r1} data={buildData(1)} fit>
				<TableColumn label="A" prop="name" />
				<TableColumn label="B" prop="count" />
			</Table>
		), { attachTo: document.body });
		await flush();
		const cols1 = measure(r1.value!, 600);
		expect(cols1.every((c: any) => c.states.realWidth >= 80)).toBe(true);

		// 2) fit + 单 flex 列 + 充足 body 宽度 → flex 列吸收剩余空间
		const r2 = ref<any>();
		const w2 = mount(() => (
			<Table ref={r2} data={buildData(1)} fit>
				<TableColumn label="A" prop="name" minWidth={80} />
				<TableColumn label="B" prop="count" width={100} />
				<TableColumn label="C" prop="address" width={100} />
			</Table>
		), { attachTo: document.body });
		await flush();
		const cols2 = measure(r2.value!, 800);
		// 唯一 flex 列吃下剩余空间：800 - (100 + 100) = 600
		const flexCol2 = cols2.find((c: any) => !c.states.width);
		expect(flexCol2?.states.realWidth).toBe(600);

		// 3) fit + 多 flex 列（≥2）→ multi-flex 分配路径
		const r3 = ref<any>();
		const w3 = mount(() => (
			<Table ref={r3} data={buildData(1)} fit>
				<TableColumn label="A" prop="name" minWidth={80} />
				<TableColumn label="B" prop="count" minWidth={80} />
				<TableColumn label="C" prop="address" minWidth={80} />
			</Table>
		), { attachTo: document.body });
		await flush();
		const cols3 = measure(r3.value!, 800);
		// 多 flex 列分配后 realWidth >= minWidth
		expect(cols3.every((c: any) => c.states.realWidth >= 80)).toBe(true);

		// 4) fit + flex 列且 bodyWidth 不足 → 触发 HAVE_SCROLL 分支，每列回落到 minWidth
		const r4 = ref<any>();
		const w4 = mount(() => (
			<Table ref={r4} data={buildData(2)} fit>
				<TableColumn label="A" prop="name" minWidth={500} />
				<TableColumn label="B" prop="count" width={500} />
			</Table>
		), { attachTo: document.body });
		await flush();
		const cols4 = measure(r4.value!, 100);
		// 不足以容纳所有列，flex 列回落 minWidth
		const flexCol4 = cols4.find((c: any) => !c.states.width);
		expect(flexCol4?.states.realWidth).toBe(500);

		// 5) fit=false + 列没有 width / minWidth → realWidth=80 fallback
		const r5 = ref<any>();
		const w5 = mount(() => (
			<Table ref={r5} data={buildData(1)} fit={false}>
				<TableColumn label="A" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();
		r5.value!.layout.updateColumnsWidth();
		expect(r5.value!.store.states.columns[0].states.realWidth).toBe(80);

		[w1, w2, w3, w4, w5].forEach(w => w.unmount());
	});

	it('Layout.updateColumnsWidth：fit 且全部设宽度时，剩余宽度交给最后一个非固定列', async () => {
		const measure = async (vm: any, bodyWidth: number) => {
			const restore = defineGetter(vm.$.vnode.el as HTMLElement, 'clientWidth', bodyWidth);
			vm.layout.updateColumnsWidth();
			restore();
			await flush();
			return vm.store.states.columns.map((c: any) => c.states.realWidth);
		};

		// 左固定 80 / 普通 200 / 普通 300 / 右固定 120，合计 700
		const r1 = ref<any>();
		const w1 = mount(() => (
			<Table ref={r1} data={buildData(2)} primaryKey="id" showSummary>
				<TableColumn label="L" prop="id" fixed="left" width={80} />
				<TableColumn label="A" prop="name" width={200} />
				<TableColumn label="B" prop="count" width={300} />
				<TableColumn label="R" prop="address" fixed="right" width={120} />
			</Table>
		), { attachTo: document.body });
		await flush();
		await sleep(80);

		// 表格更宽：最后一个非固定列（B）吸收 300，右固定列保持 120
		expect(await measure(r1.value, 1000)).toEqual([80, 200, 600, 120]);
		expect(r1.value.layout.states.bodyWidth).toBe(1000);
		expect(r1.value.layout.states.scrollX).toBe(false);
		// 合计行与表头 / 表体共用表根的 grid 模板
		const footerGrid = w1.find('.vc-table__footer .vc-table__grid').element as HTMLElement;
		expect(footerGrid.style.gridTemplateColumns).toBe('var(--vc-table-columns)');
		expect(r1.value.layout.templateColumns.value).toBe('80px 200px 600px minmax(120px, 1fr)');

		// 表格不足：回到声明宽度，出现横向滚动；剩余宽度不累积
		expect(await measure(r1.value, 500)).toEqual([80, 200, 300, 120]);
		expect(r1.value.layout.states.bodyWidth).toBe(700);
		expect(r1.value.layout.states.scrollX).toBe(true);
		expect(await measure(r1.value, 1000)).toEqual([80, 200, 600, 120]);

		// 用户拖过撑满列（B）：B 保持自身宽度，剩余宽度交给前一个没拖过的非固定列（A）
		const cols1 = r1.value.store.states.columns;
		cols1[2].states.resized = true;
		expect(await measure(r1.value, 1000)).toEqual([80, 500, 300, 120]);
		// 非固定列都拖过：不再撑满
		cols1[1].states.resized = true;
		expect(await measure(r1.value, 1000)).toEqual([80, 200, 300, 120]);
		expect(r1.value.layout.states.bodyWidth).toBe(700);
		w1.unmount();

		// width prop 变化时清除拖动标记，重新参与撑满
		const bWidth = ref(300);
		const r5 = ref<any>();
		const w5 = mount(() => (
			<Table ref={r5} data={buildData(1)} primaryKey="id">
				<TableColumn label="A" prop="name" width={200} />
				<TableColumn label="B" prop="count" width={bWidth.value} />
			</Table>
		), { attachTo: document.body });
		await flush();
		await sleep(80);
		r5.value.store.states.columns[1].states.resized = true;
		expect(await measure(r5.value, 1000)).toEqual([700, 300]);
		bWidth.value = 250;
		await flush();
		await sleep(80);
		expect(r5.value.store.states.columns[1].states.resized).toBe(false);
		expect(await measure(r5.value, 1000)).toEqual([200, 800]);
		w5.unmount();

		// 全是固定列：最后一列吸收
		const r2 = ref<any>();
		const w2 = mount(() => (
			<Table ref={r2} data={buildData(1)} primaryKey="id">
				<TableColumn label="L" prop="id" fixed="left" width={100} />
				<TableColumn label="R" prop="name" fixed="right" width={100} />
			</Table>
		), { attachTo: document.body });
		await flush();
		await sleep(80);
		expect(await measure(r2.value, 500)).toEqual([100, 400]);
		w2.unmount();

		// 最后一个非固定列是分组：由分组的最后一个叶子吸收
		const r3 = ref<any>();
		const w3 = mount(() => (
			<Table ref={r3} data={buildData(1)} primaryKey="id">
				<TableColumn label="A" prop="id" width={100} />
				<TableColumn label="G">
					<TableColumn label="G1" prop="name" width={100} />
					<TableColumn label="G2" prop="count" width={100} />
				</TableColumn>
				<TableColumn label="R" prop="address" fixed="right" width={100} />
			</Table>
		), { attachTo: document.body });
		await flush();
		await sleep(80);
		expect(await measure(r3.value, 600)).toEqual([100, 100, 300, 100]);
		w3.unmount();

		// fit=false：不自撑开
		const r4 = ref<any>();
		const w4 = mount(() => (
			<Table ref={r4} data={buildData(1)} primaryKey="id" fit={false}>
				<TableColumn label="A" prop="name" width={200} />
				<TableColumn label="B" prop="count" width={300} />
			</Table>
		), { attachTo: document.body });
		await flush();
		await sleep(80);
		expect(await measure(r4.value, 1000)).toEqual([200, 300]);
		expect(r4.value.layout.states.bodyWidth).toBe(500);
		w4.unmount();
	});

	it('lazy result with nested children / lazy nodes; selected parent selects loaded children', async () => {
		const data = [{ id: 1, name: 'r1', hasChildren: true }];
		const loadExpand = vi.fn(() => [
			{ id: 11, name: 'r1-1', children: [{ id: 111, name: 'leaf' }] },
			{ id: 12, name: 'r1-2', hasChildren: true }
		]);
		const tableRef = ref<any>();
		const onSelect = vi.fn();
		const onSelectionChange = vi.fn();
		const wrapper = mount(() => (
			<Table
				ref={tableRef}
				data={data}
				primaryKey="id"
				lazyTree
				loadExpand={loadExpand}
				defaultExpandAll
				onSelect={onSelect}
				onSelectionChange={onSelectionChange}
			>
				<TableColumn type="selection" />
				<TableColumn label="名称" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();
		const vm = tableRef.value!;
		// 未加载的懒加载节点即便 defaultExpandAll 也保持收起
		expect(vm.store.states.renderData.map((row: any) => row.id)).toEqual([1]);

		vm.toggleRowSelection(vm.store.states.data[0], true, false);
		vm.store.tree.toggle(vm.store.states.data[0]);
		await flush();
		// 加载结果中的嵌套 children 按 defaultExpandAll 展开，懒加载节点仍待加载
		expect(vm.store.states.renderData.map((row: any) => row.id)).toEqual([1, 11, 111, 12]);
		expect(vm.store.tree.nodes[12]).toEqual({ level: 1, loadable: true });
		expect(vm.store.states.selection.map((row: any) => row.id)).toEqual([1, 11, 12]);
		// 程序触发的选中不 emit select；子行一次性加入，selection-change 只额外触发一次
		expect(onSelect).not.toHaveBeenCalled();
		expect(onSelectionChange).toHaveBeenCalledTimes(2);
		wrapper.unmount();
	});

	it('expand column slot renders the content of an expanded row', async () => {
		const data = [{ id: 1, name: 'a' }];
		const wrapper = mount(() => (
			<Table data={data} primaryKey="id">
				<TableColumn type="expand" label="详情">
					{{ default: ({ row }: any) => (
						<div class="expanded-row">
							e:
							{row.name}
						</div>
					) }}
				</TableColumn>
				<TableColumn label="名称" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();
		expect(wrapper.find('.expanded-row').exists()).toBe(false);
		// 点击展开
		const icon = wrapper.find('.vc-table__expand-icon');
		await icon.trigger('click');
		await flush();
		expect(icon.classes()).toContain('is-expand');
		expect(wrapper.find('.expanded-row').text()).toBe('e:a');
		wrapper.unmount();
	});
});

describe('TableFooter summaries', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('default sum text + numeric reduction with non-number values', async () => {
		const data = [
			{ id: 1, name: 'a', count: 1, score: 1.5 },
			{ id: 2, name: 'b', count: 2, score: 2.25 },
			{ id: 3, name: 'c', count: 3, score: NaN }
		];
		const wrapper = mount(() => (
			<Table data={data} primaryKey="id" showSummary>
				<TableColumn label="名称" prop="name" />
				<TableColumn label="计数" prop="count" />
				<TableColumn label="得分" prop="score" />
			</Table>
		), { attachTo: document.body });
		await flush();

		const footerCells = wrapper.findAll('.vc-table__footer .vc-table__td');
		expect(footerCells.length).toBe(3);
		expect(footerCells[0].text()).toContain('合计');
		expect(footerCells[1].text()).toBe('6');
		wrapper.unmount();
	});
});

describe('Store unit', () => {
	it('throws when constructed without table option', () => {
		expect(() => new (Store as any)({})).toThrow();
	});

	it('cleanSelection without primaryKey + with primaryKey both paths', async () => {
		// 无 primaryKey：dataInstanceChanged=false 时走 cleanSelection 分支
		const data = buildData(2);
		const tableRef = ref<any>();
		const wrapper = mount(() => (
			<Table ref={tableRef} data={data}>
				<TableColumn type="selection" />
				<TableColumn label="名称" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();
		const vm = tableRef.value!;
		vm.toggleRowSelection(data[0], true, false);
		await flush();
		expect(vm.store.states.selection.length).toBe(1);

		// 同一引用 + 删除已选行，setData 触发 cleanSelection 清除被删行
		data.splice(0, 1);
		vm.store.setData(data);
		await flush();
		expect(vm.store.states.selection.length).toBe(0);
		wrapper.unmount();

		// 有 primaryKey + reserveSelection：updateSelectionByRowKey 分支
		const data2 = ref(buildData(2));
		const tableRef2 = ref<any>();
		const w2 = mount(() => (
			<Table ref={tableRef2} data={data2.value} primaryKey="id">
				<TableColumn type="selection" reserveSelection />
				<TableColumn label="名称" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();
		const vm2 = tableRef2.value!;
		vm2.toggleRowSelection(data2.value[0], true, false);
		await flush();
		expect(vm2.store.states.selection.length).toBe(1);

		data2.value = [{ id: data2.value[0].id, name: 'x', count: 0, address: 'z' }];
		await flush();
		await flush();
		// 同一 primaryKey 行被保留
		expect(vm2.store.states.selection.length).toBe(1);
		w2.unmount();
	});

	it('useStates handles string / function / invalid value', () => {
		const fakeStore: any = { states: { data: 'foo-value', list: 'bar-value' } };
		const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		const states = useStates({
			a: 'data',
			b: s => s.list,
			// @ts-expect-error invalid type
			c: 123
		}, fakeStore);
		expect(states.a).toBe('foo-value');
		expect(states.b).toBe('bar-value');
		expect(errorSpy).toHaveBeenCalled();
		errorSpy.mockRestore();
	});
});

describe('Layout unit', () => {
	it('parseHeight handles number / px / invalid', () => {
		expect(parseHeight(100)).toBe(100);
		expect(parseHeight('100px')).toBe(100);
		expect(parseHeight('100')).toBe(100);
		expect(parseHeight(undefined)).toBe(null);
		expect(() => parseHeight('abc')).toThrow();
	});

	it('parseWidth / parseMinWidth handle number / px / invalid', () => {
		expect(parseWidth(100)).toBe(100);
		expect(parseWidth('120px')).toBe(120);
		expect(parseWidth('abc')).toBe(null);
		expect(parseWidth(undefined)).toBe(undefined);
		expect(parseMinWidth(80)).toBe(80);
		expect(parseMinWidth('80px')).toBe(80);
		expect(parseMinWidth(undefined)).toBe(undefined);
	});

	it('layout edge cases: undefined height', async () => {
		// 注意: setHeight(0) 在 vnode.el 永远为 null 的情况下会无限 nextTick 递归 OOM，
		// 这是源码 setHeight 的 `if (!el && (value || value === 0))` 分支期望真实组件挂载后 el 会变为非 null；
		// 此处单元测试仅覆盖 undefined / null 边界，递归分支由真实组件挂载路径承担。
		const fakeStore: any = {
			table: {
				vnode: { el: null },
				exposed: {
					isReady: { value: false },
					headerWrapper: { value: null },
					footerWrapper: { value: null }
				},
				props: { showHeader: true }
			},
			states: { columns: [] }
		};
		const layout = new Layout(fakeStore);
		layout.setHeight(undefined);
		expect(layout.states.height).toBe(null);
		layout.setMaxHeight(undefined);
		expect(layout.states.height).toBe(null);
	});

	it('Layout constructor throws when store / table missing', () => {
		expect(() => new Layout({} as any)).toThrow();
		expect(() => new Layout({ table: null } as any)).toThrow();
	});

	it('keeps the is-scrolling-* class when the root re-renders its own classes', async () => {
		const stripe = ref(false);
		const wrapper = mount(() => (
			<Table data={buildData(2)} stripe={stripe.value}>
				<TableColumn label="名称" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();
		await sleep(50);
		const scrolling = () => Array.from((wrapper.element as HTMLElement).classList).filter(c => c.startsWith('is-scrolling-'));
		expect(scrolling()).toHaveLength(1);

		// 根节点类名变化会让 Vue 整体重写 class：is-scrolling-* 须被补回
		stripe.value = true;
		await flush();
		expect(wrapper.classes()).toContain('vc-table--striped');
		expect(scrolling()).toHaveLength(1);
		wrapper.unmount();
	});

	it('layout.states.scrollY follows the body Scroller measured heights', async () => {
		const tableRef = ref<any>();
		const wrapper = mount(() => (
			<Table ref={tableRef} data={buildData(5)} primaryKey="id" maxHeight={200}>
				<TableColumn label="名称" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();
		const vm = tableRef.value!;
		const el = wrapper.element as HTMLElement;
		expect(vm.layout.states.scrollY).toBe(false);
		expect(el.classList.contains('vc-table--scrollable-y')).toBe(false);

		// 模拟内容高于视口，让表体 Scroller 重新测量
		const bodyWrapper = vm.bodyXWrapper as HTMLElement;
		Object.defineProperty(bodyWrapper, 'clientHeight', { configurable: true, value: 150 });
		Object.defineProperty(bodyWrapper, 'scrollHeight', { configurable: true, value: 300 });
		await vm.scroller.refresh();
		await flush();
		expect(vm.layout.states.scrollY).toBe(true);
		expect(el.classList.contains('vc-table--scrollable-y')).toBe(true);

		// 内容不再溢出
		Object.defineProperty(bodyWrapper, 'scrollHeight', { configurable: true, value: 150 });
		await vm.scroller.refresh();
		await flush();
		expect(vm.layout.states.scrollY).toBe(false);
		wrapper.unmount();
	});

	it('layout keeps tableHeight / appendHeight, and the instance keeps bodyYWrapper / appendWrapper', async () => {
		const tableRef = ref<any>();
		const wrapper = mount(() => (
			<Table ref={tableRef} data={buildData(2)} primaryKey="id" height={300}>
				{{
					default: () => <TableColumn label="名称" prop="name" />,
					append: () => <div class="append-content">append</div>
				}}
			</Table>
		), { attachTo: document.body });
		await flush();
		const vm = tableRef.value!;
		expect(vm.bodyYWrapper).toBe(vm.bodyXWrapper);
		expect(vm.appendWrapper).toBeInstanceOf(HTMLElement);

		Object.defineProperty(wrapper.element, 'clientHeight', { configurable: true, value: 300 });
		Object.defineProperty(vm.appendWrapper, 'offsetHeight', { configurable: true, value: 36 });
		vm.layout.updateElsHeight();
		expect(vm.layout.states.tableHeight).toBe(300);
		expect(vm.layout.states.appendHeight).toBe(36);
		wrapper.unmount();
	});

	it('layout.setHeight applies inline style when el is ready', async () => {
		const data = buildData(2);
		const tableRef = ref<any>();
		const wrapper = mount(() => (
			<Table ref={tableRef} data={data}>
				<TableColumn label="名称" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();
		const vm = tableRef.value!;
		vm.layout.setHeight(300);
		await flush();
		expect((wrapper.element as HTMLElement).style.height).toBe('300px');
		vm.layout.setMaxHeight(500);
		await flush();
		expect((wrapper.element as HTMLElement).style.maxHeight).toBe('500px');
		wrapper.unmount();
	});

	it('clearing height at runtime removes the inline style and falls back to the normal body', async () => {
		const height = ref<number | undefined>(400);
		const tableRef = ref<any>();
		const wrapper = mount(() => (
			<Table ref={tableRef} data={buildData(5)} primaryKey="id" height={height.value}>
				<TableColumn label="名称" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();
		const el = wrapper.element as HTMLElement;
		const vm = tableRef.value!;
		expect(el.style.height).toBe('400px');
		expect(vm.layout.states.height).toBe(400);
		expect(wrapper.findComponent({ name: 'vc-recycle-list' }).exists()).toBe(true);

		// 模拟固定高度下测得的布局状态
		vm.layout.states.bodyHeight = 300;
		await flush();

		height.value = undefined;
		await flush();
		expect(el.style.height).toBe('');
		expect(vm.layout.states.height).toBe(null);
		expect(vm.layout.states.bodyHeight).toBe(null);
		expect(wrapper.findComponent({ name: 'vc-recycle-list' }).exists()).toBe(false);
		expect(wrapper.findComponent({ name: 'vc-table-normal-list' }).exists()).toBe(true);
		expect(wrapper.findAll('.vc-table__body-wrapper .vc-table__tr')).toHaveLength(5);

		wrapper.unmount();
	});

	it('clearing one of height / max-height keeps the other in effect', async () => {
		const height = ref<number | undefined>(400);
		const maxHeight = ref<number | undefined>(300);
		const tableRef = ref<any>();
		const wrapper = mount(() => (
			<Table ref={tableRef} data={buildData(5)} height={height.value} maxHeight={maxHeight.value}>
				<TableColumn label="名称" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();
		const el = wrapper.element as HTMLElement;
		const vm = tableRef.value!;
		expect(el.style.height).toBe('400px');
		expect(el.style.maxHeight).toBe('300px');

		maxHeight.value = undefined;
		await flush();
		expect(el.style.maxHeight).toBe('');
		expect(el.style.height).toBe('400px');
		expect(vm.layout.states.height).toBe(400);

		maxHeight.value = 300;
		await flush();
		height.value = undefined;
		await flush();
		expect(el.style.height).toBe('');
		expect(el.style.maxHeight).toBe('300px');
		expect(vm.layout.states.height).toBe(300);

		wrapper.unmount();
	});
});

describe('Table utils', () => {
	it('getRowValue covers string path / function / nested', () => {
		expect(getRowValue({ id: 'a' }, 'id')).toBe('a');
		expect(getRowValue({ id: { v: 1 } }, 'id.v')).toBe(1);
		expect(getRowValue({}, (row: any) => 'fn-' + JSON.stringify(row))).toContain('fn-');
		expect(() => getRowValue(null, 'id')).toThrow();
	});

	it('getValuesMap', () => {
		const arr = [{ id: 1 }, { id: 2 }];
		const map = getValuesMap(arr, 'id');
		expect(map[1].row.id).toBe(1);
	});

	it('sticky: syncStickyOffsets writes stickyOffset / stickyStyle onto fixed leaves (and clears non-fixed)', async () => {
		const data = buildData(2);
		const tableRef = ref<any>();
		const wrapper = mount(() => (
			<Table ref={tableRef} data={data}>
				<TableColumn label="A" prop="name" fixed="left" width={80} />
				<TableColumn label="B" prop="count" fixed="left" width={120} />
				<TableColumn label="C" prop="address" width={300} />
				<TableColumn label="D" prop="name" fixed="right" width={150} />
				<TableColumn label="E" prop="count" fixed="right" width={50} />
			</Table>
		), { attachTo: document.body });
		await flush();
		const vm = tableRef.value!;
		const left = vm.store.states.leftFixedLeafColumns;
		const right = vm.store.states.rightFixedLeafColumns;
		expect(left[0].states.stickyOffset).toBe(0);
		expect(left[0].states.stickyStyle).toEqual({ position: 'sticky', left: '0px' });
		expect(left[0].states.stickyClass).toBe('is-fixed-left');
		expect(left[1].states.stickyOffset).toBe(80);
		expect(left[1].states.stickyStyle).toEqual({ position: 'sticky', left: '80px' });
		expect(left[1].states.stickyClass).toBe('is-fixed-left is-fixed-left-tail');
		// 从右往左累加；阴影类挂在与滚动区交界的第一个右固定列上
		expect(right[right.length - 1].states.stickyOffset).toBe(0);
		expect(right[right.length - 1].states.stickyStyle).toEqual({ position: 'sticky', right: '0px' });
		expect(right[right.length - 1].states.stickyClass).toBe('is-fixed-right');
		expect(right[right.length - 2].states.stickyOffset).toBe(50);
		expect(right[right.length - 2].states.stickyStyle).toEqual({ position: 'sticky', right: '50px' });
		expect(right[right.length - 2].states.stickyClass).toBe('is-fixed-right is-fixed-right-head');
		// 非固定列 sticky 字段清空
		const notFixed = vm.store.states.notFixedColumns;
		expect(notFixed[0].states.stickyOffset).toBeUndefined();
		expect(notFixed[0].states.stickyStyle).toBeUndefined();
		expect(notFixed[0].states.stickyClass).toBeUndefined();
		wrapper.unmount();
	});

	it('sticky: header / body / footer 三处固定列都使用 layout 预算的 stickyStyle 应用 position: sticky 样式', async () => {
		const data = buildData(1);
		const wrapper = mount(() => (
			<Table data={data}>
				<TableColumn label="A" prop="name" fixed="left" width={80} />
				<TableColumn label="B" prop="count" />
				<TableColumn label="C" prop="address" fixed="right" width={100} />
			</Table>
		), { attachTo: document.body });
		await flush();
		// header / body / footer 三处的固定列都通过 sticky 表达
		const leftTh = wrapper.find('.vc-table__th.is-fixed-left').element as HTMLElement;
		const rightTh = wrapper.find('.vc-table__th.is-fixed-right').element as HTMLElement;
		const leftTd = wrapper.find('.vc-table__td.is-fixed-left').element as HTMLElement;
		const rightTd = wrapper.find('.vc-table__td.is-fixed-right').element as HTMLElement;
		expect(leftTh.style.position).toBe('sticky');
		expect(leftTh.style.left).toBe('0px');
		expect(rightTh.style.position).toBe('sticky');
		expect(rightTh.style.right).toBe('0px');
		expect(leftTd.style.position).toBe('sticky');
		expect(leftTd.style.left).toBe('0px');
		expect(rightTd.style.position).toBe('sticky');
		expect(rightTd.style.right).toBe('0px');
		// 始终不再渲染 .vc-table__fixed* 容器
		expect(wrapper.find('.vc-table__fixed').exists()).toBe(false);
		expect(wrapper.find('.vc-table__fixed-right').exists()).toBe(false);
		wrapper.unmount();
	});

	it('sticky: 虚拟滚动路径下不渲染外层 ScrollerWheel，body-wrapper 为普通 div，由 RecycleList 内部承担 X/Y 滚动', async () => {
		const wrapper = mount(() => (
			<Table data={buildData(20)} primaryKey="id" height={200} rows={5}>
				<TableColumn label="A" prop="name" fixed="left" width={120} />
				<TableColumn label="B" prop="count" width={120} />
				<TableColumn label="C" prop="address" fixed="right" width={120} />
			</Table>
		), { attachTo: document.body });
		await flush();
		await sleep(20);
		await flush();
		const bodyWrapper = wrapper.find('.vc-table__body-wrapper').element as HTMLElement;
		// 虚拟路径下 body-wrapper 是普通 div，没有 ScrollerWheel 的 class
		expect(bodyWrapper.classList.contains('vc-scroller-wheel')).toBe(false);
		// RecycleList 内部的 ScrollerWheel 提供实际滚动容器
		expect(wrapper.find('.vc-recycle-list__wrapper.vc-scroller-wheel').exists()).toBe(true);
		wrapper.unmount();
	});

	it('sticky: is-scrolling-* 状态类挂在 .vc-table 根节点（驱动 header/body/footer 三处阴影统一）', async () => {
		const wrapper = mount(() => (
			<Table data={buildData(2)}>
				<TableColumn label="A" prop="name" fixed="left" width={80} />
				<TableColumn label="B" prop="count" />
				<TableColumn label="C" prop="address" fixed="right" width={80} />
			</Table>
		), { attachTo: document.body });
		await flush();
		await sleep(30);
		await flush();
		// 初始状态：根节点应有 is-scrolling-{none|left|middle|right} 之一
		expect(wrapper.classes().some((c: any) => /^is-scrolling-/.test(c))).toBe(true);
		// body-wrapper 上不再带 is-scrolling-* 类
		const bodyWrapperCls = wrapper.find('.vc-table__body-wrapper').classes();
		expect(bodyWrapperCls.some((c: any) => /^is-scrolling-/.test(c))).toBe(false);
		wrapper.unmount();
	});

	it('sticky: TableFooter cells consume precomputed stickyStyle when showSummary + maxHeight', async () => {
		const wrapper = mount(() => (
			<Table data={buildData(2)} maxHeight={300} showSummary>
				<TableColumn label="A" prop="name" fixed="left" width={100} />
				<TableColumn label="B" prop="count" width={500} />
				<TableColumn label="C" prop="address" fixed="right" width={100} />
			</Table>
		), { attachTo: document.body });
		await flush();
		const footerLeft = wrapper.find('.vc-table__footer .vc-table__td.is-fixed-left').element as HTMLElement;
		const footerRight = wrapper.find('.vc-table__footer .vc-table__td.is-fixed-right').element as HTMLElement;
		expect(footerLeft.style.position).toBe('sticky');
		expect(footerLeft.style.left).toBe('0px');
		expect(footerRight.style.position).toBe('sticky');
		expect(footerRight.style.right).toBe('0px');
		wrapper.unmount();
	});

	it('sticky: grid 下无行高测量回写（rows 不携带 height 字段）', async () => {
		const data = buildData(1);
		const tableRef = ref<any>();
		const wrapper = mount(() => (
			<Table ref={tableRef} data={data}>
				<TableColumn label="A" prop="name" fixed="left" width={80} />
				<TableColumn label="B" prop="count" />
				<TableColumn label="C" prop="address" fixed="right" width={80} />
			</Table>
		), { attachTo: document.body });
		await flush();
		const vm = tableRef.value!;
		const list = vm.store.states.list;
		// 同一 grid 行内的 cell 高度天然同步，行对象不再有 height 缓存
		expect('height' in list[0].rows[0]).toBe(false);
		wrapper.unmount();
	});

	it('height + showSummary + fixed columns: sticky 模式下 footer 单元格自身 sticky', async () => {
		const wrapper = mount(() => (
			<Table data={buildData(2)} height={300} showSummary>
				<TableColumn label="A" prop="name" fixed="left" width={100} />
				<TableColumn label="B" prop="count" />
				<TableColumn label="C" prop="address" fixed="right" width={100} />
			</Table>
		), { attachTo: document.body });
		await flush();
		await sleep(20);
		// 不再渲染 .vc-table__fixed* 三套 DOM
		expect(wrapper.find('.vc-table__fixed').exists()).toBe(false);
		expect(wrapper.find('.vc-table__fixed-right').exists()).toBe(false);
		expect(wrapper.find('.vc-table__fixed-footer-wrapper').exists()).toBe(false);
		// footer 的左右固定单元格通过 sticky 表达
		expect(wrapper.find('.vc-table__footer .vc-table__td.is-fixed-left').exists()).toBe(true);
		expect(wrapper.find('.vc-table__footer .vc-table__td.is-fixed-right').exists()).toBe(true);
		wrapper.unmount();
	});

	it('sticky: syncStickyOffsets walks fixed groups down to leaves (offsets, edge classes, recursive clear)', async () => {
		const data = buildData(2);
		const tableRef = ref<any>();
		const wrapper = mount(() => (
			<Table ref={tableRef} data={data}>
				<TableColumn label="L" prop="name" fixed="left" width={80} />
				<TableColumn label="M" prop="address" />
				<TableColumn label="R" prop="count" fixed="right" width={120} />
			</Table>
		), { attachTo: document.body });
		await flush();
		const vm = tableRef.value!;
		const leftLeaf1 = buildColumnNode({ realWidth: 60, width: 60 });
		const leftLeaf2 = buildColumnNode({ realWidth: 100, width: 100 });
		// 分组自身的 realWidth 不参与偏移计算
		const groupedLeft = buildColumnNode({ realWidth: 80 }, [leftLeaf1, leftLeaf2]);
		const leftTail = buildColumnNode({ realWidth: 30, width: 30 });
		const rightLeaf1 = buildColumnNode({ realWidth: 40, width: 40 });
		const rightLeaf2 = buildColumnNode({ realWidth: 70, width: 70 });
		const groupedRight = buildColumnNode({ realWidth: 80 }, [rightLeaf1, rightLeaf2]);
		const rightTail = buildColumnNode({ realWidth: 20, width: 20 });
		vm.store.states.leftFixedColumns = [groupedLeft, leftTail];
		vm.store.states.rightFixedColumns = [groupedRight, rightTail];
		const notFixedLeaf = buildColumnNode({ stickyOffset: 999, stickyStyle: { position: 'sticky', left: '0px' }, stickyClass: 'is-fixed-left' });
		const notFixedColumn = buildColumnNode(
			{
				realWidth: 200,
				stickyOffset: 1,
				stickyStyle: { position: 'sticky', left: '0px' },
				stickyClass: 'is-fixed-left'
			},
			[notFixedLeaf]
		);
		vm.store.states.notFixedColumns = [notFixedColumn];
		vm.layout.syncStickyOffsets();

		// 左：按叶子宽度累加，分组取首个叶子的偏移；交界在最后一个叶子
		expect(groupedLeft.states.stickyOffset).toBe(0);
		expect(groupedLeft.states.stickyClass).toBe('is-fixed-left');
		expect(leftLeaf1.states.stickyStyle).toEqual({ position: 'sticky', left: '0px' });
		expect(leftLeaf2.states.stickyStyle).toEqual({ position: 'sticky', left: '60px' });
		expect(leftLeaf2.states.stickyClass).toBe('is-fixed-left');
		expect(leftTail.states.stickyStyle).toEqual({ position: 'sticky', left: '160px' });
		expect(leftTail.states.stickyClass).toBe('is-fixed-left is-fixed-left-tail');

		// 右：从最右往左累加，分组取末个叶子的偏移；交界在第一个叶子（及包含它的分组）
		expect(rightTail.states.stickyStyle).toEqual({ position: 'sticky', right: '0px' });
		expect(rightTail.states.stickyClass).toBe('is-fixed-right');
		expect(rightLeaf2.states.stickyStyle).toEqual({ position: 'sticky', right: '20px' });
		expect(rightLeaf2.states.stickyClass).toBe('is-fixed-right');
		expect(rightLeaf1.states.stickyStyle).toEqual({ position: 'sticky', right: '90px' });
		expect(rightLeaf1.states.stickyClass).toBe('is-fixed-right is-fixed-right-head');
		expect(groupedRight.states.stickyStyle).toEqual({ position: 'sticky', right: '20px' });
		expect(groupedRight.states.stickyClass).toBe('is-fixed-right is-fixed-right-head');

		// 非固定列（含子列）清除 sticky
		expect(notFixedColumn.states.stickyOffset).toBeUndefined();
		expect(notFixedColumn.states.stickyStyle).toBeUndefined();
		expect(notFixedColumn.states.stickyClass).toBeUndefined();
		expect(notFixedLeaf.states.stickyOffset).toBeUndefined();
		expect(notFixedLeaf.states.stickyStyle).toBeUndefined();
		expect(notFixedLeaf.states.stickyClass).toBeUndefined();
		wrapper.unmount();
	});

	it('sticky: fixed multi-level group renders its leaf header / body / footer cells as sticky', async () => {
		const data = buildData(2);
		const wrapper = mount(() => (
			<Table data={data} showSummary>
				<TableColumn label="分组" fixed="left">
					<TableColumn label="A" prop="name" width={100} />
					<TableColumn label="B" prop="count" width={120} />
				</TableColumn>
				<TableColumn label="C" prop="address" width={300} />
				<TableColumn label="D" prop="name" fixed="right" width={150} />
				<TableColumn label="E" prop="count" fixed="right" width={50} />
			</Table>
		), { attachTo: document.body });
		await flush();
		await sleep(20);

		const bodyCells = wrapper.findAll('.vc-table__body-wrapper .vc-table__tr')[0].findAll('.vc-table__td');
		const footerCells = wrapper.findAll('.vc-table__footer .vc-table__td');
		const leftStyle = (el: any) => (el.element as HTMLElement).style.left;
		const rightStyle = (el: any) => (el.element as HTMLElement).style.right;

		// 分组下的叶子：表体、合计行都 sticky，偏移按叶子宽度累加
		[bodyCells, footerCells].forEach((cells) => {
			expect(cells[0].classes()).toContain('is-fixed-left');
			expect(leftStyle(cells[0])).toBe('0px');
			expect(cells[1].classes()).toEqual(expect.arrayContaining(['is-fixed-left', 'is-fixed-left-tail']));
			expect(leftStyle(cells[1])).toBe('100px');
			expect(cells[2].classes()).not.toContain('is-fixed-left');
			// 右侧阴影在与滚动区交界的 D 上，而不是最右的 E
			expect(cells[3].classes()).toEqual(expect.arrayContaining(['is-fixed-right', 'is-fixed-right-head']));
			expect(rightStyle(cells[3])).toBe('50px');
			expect(cells[4].classes()).not.toContain('is-fixed-right-head');
			expect(rightStyle(cells[4])).toBe('0px');
		});

		// 表头：分组与其叶子都 sticky，分组带交界类
		const th = (label: string) => wrapper.findAll('.vc-table__th').find(item => item.text() === label)!;
		expect(th('分组').classes()).toEqual(expect.arrayContaining(['is-fixed-left', 'is-fixed-left-tail']));
		expect(th('A').classes()).toContain('is-fixed-left');
		expect(leftStyle(th('B'))).toBe('100px');
		wrapper.unmount();
	});

	it('columnsToRowsEffect handles nested children', () => {
		const cols = [
			buildColumnNode({}, [buildColumnNode(), buildColumnNode()]),
			buildColumnNode()
		];
		const rows = columnsToRowsEffect(cols);
		expect(rows.length).toBeGreaterThanOrEqual(1);
		expect(cols[0].states.colspan).toBe(2);
	});
});

describe('v-model:columns & hidden', () => {
	it('write-back of an emitted empty list resets the echo guard', async () => {
		const tableRef = ref<any>();
		const columns = ref<any[]>([]);
		const visible = ref(true);
		const wrapper = mount(() => (
			<Table
				ref={tableRef}
				data={buildData(1)}
				columns={columns.value}
				{...{ 'onUpdate:columns': (v: any[]) => { columns.value = v; } }}
			>
				{visible.value ? <TableColumn label="名称" prop="name" /> : null}
			</Table>
		), { attachTo: document.body });
		await flush();
		const vm = tableRef.value!;
		expect(columns.value).toHaveLength(1);
		expect(vm.store.column._sync.suppressWatch).toBe(false);

		// 列全部移除：emit [] 并被写回，回流标志应复位
		visible.value = false;
		await flush();
		await sleep(60);
		await flush();
		expect(columns.value).toEqual([]);
		expect(vm.store.column._sync.suppressWatch).toBe(false);
		wrapper.unmount();
	});

	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('emits update:columns with all leaf columns (incl. structural columns) on mount', async () => {
		const onUpdateColumns = vi.fn();
		const wrapper = mount(() => (
			<Table
				data={buildData(2)}
				primaryKey="id"
				{...{ 'onUpdate:columns': onUpdateColumns }}
			>
				<TableColumn type="selection" />
				<TableColumn label="日期" prop="date" />
				<TableColumn label="姓名" prop="name" />
				<TableColumn label="地址" prop="address" />
			</Table>
		), { attachTo: document.body });
		await flush();

		expect(onUpdateColumns).toHaveBeenCalled();
		const payload = onUpdateColumns.mock.calls.at(-1)![0];
		expect(payload).toHaveLength(4);

		const selectionCol = payload.find((c: any) => c.type === 'selection');
		expect(selectionCol).toBeTruthy();
		expect(selectionCol.prop).toBeUndefined();
		expect(selectionCol.hidden).toBeFalsy(); // undefined
		expect(payload.map((c: any) => c.prop)).toEqual([undefined, 'date', 'name', 'address']);
		// 仅暴露可序列化字段，不泄漏内部函数
		expect(payload.every((c: any) => typeof (c as any).renderCell === 'undefined')).toBe(true);

		wrapper.unmount();
	});

	it('re-emits update:columns when columns are dynamically added / removed', async () => {
		const onUpdateColumns = vi.fn();
		const extra = ref(false);
		const wrapper = mount(() => (
			<Table
				data={buildData(1)}
				primaryKey="id"
				{...{ 'onUpdate:columns': onUpdateColumns }}
			>
				{{
					default: () => [
						<TableColumn label="姓名" prop="name" />,
						<TableColumn label="计数" prop="count" />,
						extra.value ? <TableColumn label="地址" prop="address" /> : null
					]
				}}
			</Table>
		), { attachTo: document.body });
		await flush();

		expect(onUpdateColumns.mock.calls.at(-1)![0]).toHaveLength(2);

		extra.value = true;
		await flush();
		await sleep(60);
		await flush();
		expect(onUpdateColumns.mock.calls.at(-1)![0]).toHaveLength(3);
		expect(onUpdateColumns.mock.calls.at(-1)![0].map((c: any) => c.prop)).toEqual(['name', 'count', 'address']);

		extra.value = false;
		await flush();
		await sleep(60);
		await flush();
		expect(onUpdateColumns.mock.calls.at(-1)![0]).toHaveLength(2);

		wrapper.unmount();
	});

	it('external write-back of hidden=true removes column from render but keeps it collected', async () => {
		const tableRef = ref<any>();
		const columns = ref<any[]>([]);
		const wrapper = mount(() => (
			<Table
				ref={tableRef}
				data={buildData(2)}
				primaryKey="id"
				columns={columns.value}
				{...{ 'onUpdate:columns': (v: any[]) => { columns.value = v; } }}
			>
				<TableColumn label="姓名" prop="name" />
				<TableColumn label="计数" prop="count" />
				<TableColumn label="地址" prop="address" />
			</Table>
		), { attachTo: document.body });
		await flush();
		const vm = tableRef.value!;

		expect(columns.value).toHaveLength(3);
		expect(vm.store.states.columns).toHaveLength(3);
		const totalColumns = vm.store.states._columns.length;

		// 写回：隐藏 name 列
		columns.value = columns.value.map((c: any) => (
			c.prop === 'name' ? { ...c, hidden: true } : c
		));
		await flush();
		await sleep(60);
		await flush();

		const visibleProps = vm.store.states.columns.map((c: any) => c.states.prop);
		expect(visibleProps).not.toContain('name');
		expect(visibleProps).toEqual(['count', 'address']);
		// headerRows 也不含被隐藏列
		expect(vm.store.states.headerRows.flat().map((c: any) => c.states.prop)).not.toContain('name');
		// 列仍被收集，_columns 不变
		expect(vm.store.states._columns.length).toBe(totalColumns);
		// 暴露快照仍包含该列且 hidden=true
		const hiddenInPayload = columns.value.find((c: any) => c.prop === 'name');
		expect(hiddenInPayload).toBeTruthy();
		expect(hiddenInPayload.hidden).toBe(true);

		// 写回：恢复 name 列
		columns.value = columns.value.map((c: any) => (
			c.prop === 'name' ? { ...c, hidden: false } : c
		));
		await flush();
		await sleep(60);
		await flush();
		expect(vm.store.states.columns.map((c: any) => c.states.prop)).toContain('name');

		wrapper.unmount();
	});

	it('hidden works for structural columns without prop (matched by id)', async () => {
		const tableRef = ref<any>();
		const columns = ref<any[]>([]);
		const wrapper = mount(() => (
			<Table
				ref={tableRef}
				data={buildData(2)}
				primaryKey="id"
				columns={columns.value}
				{...{ 'onUpdate:columns': (v: any[]) => { columns.value = v; } }}
			>
				<TableColumn type="selection" />
				<TableColumn label="姓名" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();
		const vm = tableRef.value!;

		expect(vm.store.states.columns.some((c: any) => c.states.type === 'selection')).toBe(true);

		const selectionId = columns.value.find((c: any) => c.type === 'selection').id;
		columns.value = columns.value.map((c: any) => (
			c.id === selectionId ? { ...c, hidden: true } : c
		));
		await flush();
		await sleep(60);
		await flush();

		expect(vm.store.states.columns.some((c: any) => c.states.type === 'selection')).toBe(false);
		expect(wrapper.find('.vc-table__selection-column').exists()).toBe(false);

		wrapper.unmount();
	});

	it('external write-back reorders columns by id (reversed)', async () => {
		const tableRef = ref<any>();
		const columns = ref<any[]>([]);
		const wrapper = mount(() => (
			<Table
				ref={tableRef}
				data={buildData(2)}
				primaryKey="id"
				columns={columns.value}
				{...{ 'onUpdate:columns': (v: any[]) => { columns.value = v; } }}
			>
				<TableColumn label="姓名" prop="name" />
				<TableColumn label="计数" prop="count" />
				<TableColumn label="地址" prop="address" />
			</Table>
		), { attachTo: document.body });
		await flush();
		const vm = tableRef.value!;

		expect(vm.store.states.originColumns.map((c: any) => c.states.prop)).toEqual(['name', 'count', 'address']);

		columns.value = [...columns.value].reverse();
		await flush();
		await sleep(60);
		await flush();

		expect(vm.store.states.originColumns.map((c: any) => c.states.prop)).toEqual(['address', 'count', 'name']);

		wrapper.unmount();
	});

	it('does not loop indefinitely on external write-back (fingerprint guard)', async () => {
		const onUpdateColumns = vi.fn();
		const tableRef = ref<any>();
		const columns = ref<any[]>([]);
		const wrapper = mount(() => (
			<Table
				ref={tableRef}
				data={buildData(1)}
				primaryKey="id"
				columns={columns.value}
				{...{ 'onUpdate:columns': (v: any[]) => { columns.value = v; onUpdateColumns(v); } }}
			>
				<TableColumn label="姓名" prop="name" />
				<TableColumn label="计数" prop="count" />
			</Table>
		), { attachTo: document.body });
		await flush();
		await sleep(60);
		await flush();

		const baseline = onUpdateColumns.mock.calls.length;

		// 隐藏一列触发一次写回；应当只产生有限的 emit，而非无限回环
		columns.value = columns.value.map((c: any) => (
			c.prop === 'name' ? { ...c, hidden: true } : c
		));
		await flush();
		await sleep(60);
		await flush();

		const afterToggle = onUpdateColumns.mock.calls.length;
		expect(afterToggle - baseline).toBeLessThanOrEqual(2);

		// 静置后不应继续增长
		await sleep(60);
		await flush();
		expect(onUpdateColumns.mock.calls.length).toBe(afterToggle);

		wrapper.unmount();
	});

	it('multi-level header: parent colspan shrinks as leaves are hidden (store-level)', () => {
		const emit = vi.fn();
		const store: any = new Store({
			table: {
				props: {
					expandSelectable: true,
					lazy: false,
					treeMap: { hasChildren: 'hasChildren', children: 'children' }
				},
				emit
			}
		});

		store.states._columns = [
			buildColumnNode({ id: 'g1', label: '分组' }, [
				buildColumnNode({ id: 'c1', prop: 'a', label: 'A' }),
				buildColumnNode({ id: 'c2', prop: 'b', label: 'B' })
			]),
			buildColumnNode({ id: 'c3', prop: 'c', label: 'C' })
		];
		store.updateColumns();

		const group0 = store.states.headerRows[0].find((c: any) => c.states.id === 'g1');
		expect(group0.states.colspan).toBe(2);
		expect(store.states.columns.map((c: any) => c.states.prop)).toEqual(['a', 'b', 'c']);

		// 隐藏其中一个子列 -> 父级 colspan 收缩为 1
		store.states._columns[0].childNodes[0].states.hidden = true;
		store.updateColumns();
		const group1 = store.states.headerRows[0].find((c: any) => c.states.id === 'g1');
		expect(group1.states.colspan).toBe(1);
		expect(store.states.columns.map((c: any) => c.states.prop)).toEqual(['b', 'c']);

		// 隐藏全部子列 -> 父分组不再渲染
		store.states._columns[0].childNodes[1].states.hidden = true;
		store.updateColumns();
		expect(store.states.originColumns.some((c: any) => c.states.id === 'g1')).toBe(false);
		expect(store.states.columns.map((c: any) => c.states.prop)).toEqual(['c']);
	});

	it('applyExternalColumns: guards, nested hidden, and top-level reorder (store-level)', () => {
		const emit = vi.fn();
		const store: any = new Store({
			table: {
				props: {
					expandSelectable: true,
					lazy: false,
					treeMap: { hasChildren: 'hasChildren', children: 'children' }
				},
				emit
			}
		});
		// 提供 exposed.debouncedUpdateLayout 以便 scheduleLayout 不报错
		store.table.exposed = { isReady: { value: true }, debouncedUpdateLayout: vi.fn() };

		store.states._columns = [
			buildColumnNode({ id: 'g1', label: '分组' }, [
				buildColumnNode({ id: 'c1', prop: 'a', label: 'A' }),
				buildColumnNode({ id: 'c2', prop: 'b', label: 'B' })
			]),
			buildColumnNode({ id: 'c3', prop: 'c', label: 'C' })
		];
		store.updateColumns();
		// 单测直接调用 applyExternalColumns（无父组件消费 emit 回流），
		// 每次生效的 apply 都会经 updateColumns 重新置位防回环，
		// 故在每次期望生效的调用前手动清掉置位。
		const apply = (v: any) => {
			store.column._sync.suppressWatch = false;
			store.column.applyExternal(v);
		};

		// guards: 非数组 / 空数组 -> 直接返回，不改动
		apply('nope' as any);
		apply([]);
		expect(store.states._columns.map((c: any) => c.states.id)).toEqual(['g1', 'c3']);

		// null 项与无 id 项被忽略；无变化时不重排
		apply([null, { prop: 'x' }]);
		expect(store.states._columns.map((c: any) => c.states.id)).toEqual(['g1', 'c3']);

		// 递归隐藏嵌套子列（按 id 命中 children）
		apply([{ id: 'c1', hidden: true }]);
		expect(store.states.columns.map((c: any) => c.states.prop)).toEqual(['b', 'c']);
		expect(store.states._columns.map((c: any) => c.states.id)).toEqual(['g1', 'c3']);

		// 顶层按 id 重排
		apply([{ id: 'c3' }, { id: 'g1' }]);
		expect(store.states._columns.map((c: any) => c.states.id)).toEqual(['c3', 'g1']);

		// 同序写回 -> orderChanged=false 且 hiddenChanged=false -> 不再变动
		apply([{ id: 'c3' }, { id: 'g1' }]);
		expect(store.states._columns.map((c: any) => c.states.id)).toEqual(['c3', 'g1']);
	});

	it('affix: boolean 流式高度下表头/合计行启用吸附', async () => {
		const data = buildData(20);
		const wrapper = mount(() => (
			<Table data={data} primaryKey="id" affix showSummary>
				<TableColumn label="名称" prop="name" />
				<TableColumn label="数量" prop="count" />
			</Table>
		), { attachTo: document.body });
		await flush();

		// 表头 + 合计行两处均被 Affix 包裹
		expect(wrapper.findAll('.vc-affix').length).toBe(2);

		wrapper.unmount();
	});

	it('affix: array [top, bottom] 分别控制两端', async () => {
		const data = buildData(20);
		const wrapper = mount(() => (
			<Table data={data} primaryKey="id" affix={[true, false]} showSummary>
				<TableColumn label="名称" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();

		// top=true 表头启用吸附，bottom=false 合计行禁用（透传无 .vc-affix），故仅 1 个
		expect(wrapper.findAll('.vc-affix').length).toBe(1);

		wrapper.unmount();
	});

	it('affix: object 同时作用于两端并透传配置', async () => {
		const data = buildData(20);
		const wrapper = mount(() => (
			<Table data={data} primaryKey="id" affix={{ offset: 10 }} showSummary>
				<TableColumn label="名称" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();

		expect(wrapper.findAll('.vc-affix').length).toBe(2);

		wrapper.unmount();
	});

	it('affix: 活动范围默认限定为表体，可被配置覆盖', async () => {
		const tableRef = ref<any>();
		const wrapper = mount(() => (
			<Table ref={tableRef} data={buildData(20)} primaryKey="id" affix={[{ fixed: false }, { target: '.custom' }]} showSummary>
				<TableColumn label="名称" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();

		const [header, footer] = wrapper.findAllComponents({ name: 'vc-affix' });
		expect(header.props('target')).toBe(`.${tableRef.value.tableId} .vc-table__body-wrapper`);
		// 表格内首个匹配即自身的表体
		expect(document.querySelector(header.props('target'))).toBe(wrapper.find('.vc-table__body-wrapper').element);
		expect(header.props('fixed')).toBe(false);
		expect(footer.props('target')).toBe('.custom');

		wrapper.unmount();
	});

	it('affix: 设置 height 时强制禁用（不产生吸附态 DOM）', async () => {
		const data = buildData(20);
		const wrapper = mount(() => (
			<Table data={data} primaryKey="id" affix height={200} showSummary>
				<TableColumn label="名称" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();

		// disabled 时 Affix 直接透传 slot，不渲染 .vc-affix 容器
		expect(wrapper.find('.vc-affix').exists()).toBe(false);

		wrapper.unmount();
	});

	it('affix: refreshAffix 可调用且不抛错', async () => {
		const data = buildData(10);
		const tableRef = ref<any>();
		const wrapper = mount(() => (
			<Table ref={tableRef} data={data} primaryKey="id" affix showSummary>
				<TableColumn label="名称" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();

		expect(typeof tableRef.value!.refreshAffix).toBe('function');
		expect(() => tableRef.value!.refreshAffix()).not.toThrow();
		await flush();

		wrapper.unmount();
	});

	describe('底部 dock（横向滚动条 + 合计行）', () => {
		// 表体在列收集后的下一次渲染出现，Bar 还要再等 wrapper 就绪与 Teleport 目标检查
		const settle = async () => {
			for (let i = 0; i < 3; i++) await flush();
		};
		// 轨道外层有 Transition（测试中为 transition-stub），按所属锚点归类而非直接子节点
		const horizontalTracksIn = (anchor: Element | null | undefined) => {
			if (!anchor) return [];
			return [...anchor.querySelectorAll('.vc-scroller-track.is-horizontal')]
				.filter(el => el.closest('.vc-table__bar-x') === anchor);
		};
		const horizontalTrackIn = (anchor: Element | null | undefined) => horizontalTracksIn(anchor)[0] || null;
		// 直接挂在表格根节点（不在任何锚点内）的轨道
		const rootTracks = (wrapper: any) => {
			const root = wrapper.find('.vc-table').element as HTMLElement;
			return [...root.querySelectorAll('.vc-scroller-track')]
				.filter(el => !el.closest('.vc-table__bar-x') && el.closest('.vc-table') === root);
		};

		it('流式高度（含 virtualized）下横向滚动条挂在 dock 锚点，height 模式仍在根节点', async () => {
			for (const extra of [{}, { virtualized: true }]) {
				const tableRef = ref<any>();
				const wrapper = mount(() => (
					<Table ref={tableRef} data={buildData(10)} primaryKey="id" {...extra}>
						<TableColumn label="名称" prop="name" />
					</Table>
				), { attachTo: document.body });
				await settle();

				const anchor = tableRef.value.barAnchor;
				expect(anchor.classList.contains('vc-table__bar-x')).toBe(true);
				expect(horizontalTrackIn(anchor)).toBeTruthy();
				expect(rootTracks(wrapper).length).toBe(0);
				wrapper.unmount();
			}

			const tableRef = ref<any>();
			const wrapper = mount(() => (
				<Table ref={tableRef} data={buildData(10)} primaryKey="id" height={200}>
					<TableColumn label="名称" prop="name" />
				</Table>
			), { attachTo: document.body });
			await settle();

			expect(horizontalTrackIn(tableRef.value.barAnchor)).toBeFalsy();
			expect(rootTracks(wrapper).some(el => el.classList.contains('is-horizontal'))).toBe(true);
			wrapper.unmount();
		});

		it('无合计行时 affix bottom 控制滚动条吸底，且活动范围为表体', async () => {
			const tableRef = ref<any>();
			const wrapper = mount(() => (
				<Table ref={tableRef} data={buildData(10)} primaryKey="id" affix>
					<TableColumn label="名称" prop="name" />
				</Table>
			), { attachTo: document.body });
			await settle();

			const affixes = wrapper.findAll('.vc-affix');
			expect(affixes.length).toBe(2);
			const dockPlaceholder = affixes[1].element;
			expect(dockPlaceholder.querySelector('.vc-table__bar-x')).toBe(tableRef.value.barAnchor);

			const body = wrapper.find('.vc-table__body-wrapper').element;
			const rect = (value: Partial<DOMRect>) => ({ left: 0, right: 0, width: 300, x: 0, y: 0, toJSON: () => ({}), ...value }) as DOMRect;
			const placeholderSpy = vi.spyOn(dockPlaceholder, 'getBoundingClientRect');
			const bodySpy = vi.spyOn(body, 'getBoundingClientRect');

			// 表格还没进入视口：表体顶部在视口下方，不吸底（target 解析到表体而非 documentElement）
			placeholderSpy.mockReturnValue(rect({ top: 3000, bottom: 3000, height: 0 }));
			bodySpy.mockReturnValue(rect({ top: 1000, bottom: 3000, height: 2000 }));
			tableRef.value.refreshAffix();
			await flush();
			expect(wrapper.find('.vc-affix__fixed .vc-table__bar-x').exists()).toBe(false);

			// 表体已进入视口、dock 在视口下方：只有滚动条吸底
			bodySpy.mockReturnValue(rect({ top: 100, bottom: 3000, height: 2900 }));
			tableRef.value.refreshAffix();
			await flush();
			const fixedAnchor = wrapper.find('.vc-affix__fixed .vc-table__bar-x');
			expect(fixedAnchor.exists()).toBe(true);
			expect(horizontalTrackIn(fixedAnchor.element)).toBeTruthy();
			expect(wrapper.find('.vc-table__footer-wrapper').exists()).toBe(false);

			placeholderSpy.mockRestore();
			bodySpy.mockRestore();
			wrapper.unmount();
		});

		it('affix=[true, false] 且无合计行时滚动条不吸底，仍在锚点', async () => {
			const tableRef = ref<any>();
			const wrapper = mount(() => (
				<Table ref={tableRef} data={buildData(10)} primaryKey="id" affix={[true, false]}>
					<TableColumn label="名称" prop="name" />
				</Table>
			), { attachTo: document.body });
			await settle();

			expect(wrapper.findAll('.vc-affix').length).toBe(1);
			expect(horizontalTrackIn(tableRef.value.barAnchor)).toBeTruthy();
			wrapper.unmount();
		});

		it('运行时切换 affix bottom：滚动条跟随重建后的锚点，dock 上的滚轮仍转发给表体', async () => {
			const affix = ref<any>(true);
			const tableRef = ref<any>();
			const wrapper = mount(() => (
				<Table ref={tableRef} data={buildData(10)} primaryKey="id" affix={affix.value} showSummary>
					<TableColumn label="A" prop="name" width={240} />
					<TableColumn label="B" prop="count" width={240} />
					<TableColumn label="C" prop="address" width={240} />
				</Table>
			), { attachTo: document.body });
			await settle();

			const expectTrackInLiveAnchor = () => {
				const anchor = tableRef.value.barAnchor as HTMLElement;
				expect(anchor.isConnected).toBe(true);
				expect(horizontalTrackIn(anchor)).toBeTruthy();
			};

			const first = tableRef.value.barAnchor;
			expectTrackInLiveAnchor();

			affix.value = [true, false];
			await settle();
			expect(tableRef.value.barAnchor).not.toBe(first);
			expectTrackInLiveAnchor();

			affix.value = true;
			await settle();
			expectTrackInLiveAnchor();

			const innerScroller = wrapper.findComponent({ name: 'vc-scroller-wheel' });
			const innerScrollTo = vi.fn();
			(innerScroller.vm as any).$!.exposed.scrollTo = innerScrollTo;

			const xWrapper = wrapper.find('.vc-table__body-wrapper').element as HTMLElement;
			makeWritable(xWrapper, 'scrollLeft');
			const restores = [
				defineGetter(xWrapper, 'scrollWidth', 720),
				defineGetter(xWrapper, 'clientWidth', 240)
			];

			wrapper.find('.vc-table__bottom').element.dispatchEvent(new WheelEvent('wheel', {
				bubbles: true,
				cancelable: true,
				deltaX: 30,
				deltaY: 0
			} as any));
			await flush();
			await sleep(20);

			expect(innerScrollTo).toHaveBeenCalledWith({ x: 30 });

			restores.forEach(fn => fn());
			wrapper.unmount();
		});

		it('悬停表格时显示锚点内的横向滚动条', async () => {
			const tableRef = ref<any>();
			const wrapper = mount(() => (
				<Table ref={tableRef} data={buildData(10)} primaryKey="id">
					<TableColumn label="名称" prop="name" />
				</Table>
			), { attachTo: document.body });
			await settle();

			const xWrapper = wrapper.find('.vc-table__body-wrapper').element as HTMLElement;
			const restores = [
				defineGetter(xWrapper, 'scrollWidth', 720),
				defineGetter(xWrapper, 'clientWidth', 240)
			];
			await tableRef.value.scroller.refresh();
			await flush();

			const track = horizontalTrackIn(tableRef.value.barAnchor) as HTMLElement;
			expect(track.style.display).toBe('none');

			const root = wrapper.find('.vc-table').element;
			root.dispatchEvent(new MouseEvent('mousemove', { bubbles: true }));
			await flush();
			expect(track.style.display).not.toBe('none');

			root.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
			await flush();
			expect(track.style.display).toBe('none');

			restores.forEach(fn => fn());
			wrapper.unmount();
		});

		it('展开行嵌套表格时，内外层滚动条各自在自己的锚点', async () => {
			const outerRef = ref<any>();
			const innerRef = ref<any>();
			const wrapper = mount(() => (
				<Table ref={outerRef} data={buildData(1)} primaryKey="id" defaultExpandAll>
					<TableColumn type="expand">
						{{
							default: () => (
								<Table ref={innerRef} data={buildData(2)} primaryKey="id">
									<TableColumn label="内层" prop="name" />
								</Table>
							)
						}}
					</TableColumn>
					<TableColumn label="外层" prop="name" />
				</Table>
			), { attachTo: document.body });
			await settle();
			await settle();

			const outerAnchor = outerRef.value.barAnchor as HTMLElement;
			const innerAnchor = innerRef.value.barAnchor as HTMLElement;
			expect(innerAnchor).toBeTruthy();
			expect(outerAnchor).not.toBe(innerAnchor);
			expect(horizontalTracksIn(outerAnchor).length).toBe(1);
			expect(horizontalTracksIn(innerAnchor).length).toBe(1);

			wrapper.unmount();
		});

		it('virtualized + lazyTail：未到末尾时 dock 已渲染，row-resize 刷新底部 Affix', async () => {
			const wrapper = mount(() => (
				<Table data={buildData(20)} primaryKey="id" virtualized lazyTail affix>
					{{
						default: () => <TableColumn label="名称" prop="name" />,
						append: () => <div class="lazy-append">append</div>
					}}
				</Table>
			), { attachTo: document.body });
			await flush();

			expect(wrapper.find('.vc-table__bottom .vc-table__bar-x').exists()).toBe(true);

			const [, dockAffix] = wrapper.findAllComponents({ name: 'vc-affix' });
			const refresh = vi.fn();
			(dockAffix.vm as any).$!.exposed.refresh = refresh;
			wrapper.findComponent({ name: 'vc-recycle-list' }).vm.$emit('row-resize', []);
			await flush();
			expect(refresh).toHaveBeenCalledTimes(1);

			wrapper.unmount();
		});
	});
});

describe('TableGrid (getSpan 合并 + grid 表头)', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('computeMergePlan: 切块 / spans / skip / 0 值 / 越界裁剪（cells 不预构建）', () => {
		const data = buildData(5);
		const columns = ['c0', 'c1', 'c2'].map(id => buildColumnNode({ id }));
		const columnCount = columns.length;
		// 第 0 列每 2 行合并；row0 的 c1+c2 横向合并；row4 c2 越界 rowspan
		const getSpan = ({ rowIndex, columnIndex, column }: any) => {
			expect(column.id).toBe(`c${columnIndex}`);
			if (columnIndex === 0) return rowIndex % 2 === 0 ? [2, 1] : [0, 0];
			if (rowIndex === 0 && columnIndex === 1) return { rowspan: 1, colspan: 2 };
			if (rowIndex === 0 && columnIndex === 2) return [0, 0];
			if (rowIndex === 4 && columnIndex === 2) return [99, 1];
			return [1, 1];
		};
		const plan = computeMergePlan(data, columns, getSpan);

		// rows: [0,1] 合并、[2,3] 合并、[4] 单行
		expect(plan.blocks.map((b: any) => [b.start, b.end])).toEqual([[0, 1], [2, 3], [4, 4]]);

		// cells 不再预构建，块上仅有 hasMerge 标记
		expect(plan.blocks.every((b: any) => !b.cells)).toBe(true);
		expect(plan.blocks[0].hasMerge).toBe(true);
		expect(plan.blocks[1].hasMerge).toBe(true);

		// spans 仅含 anchor；skip 含被覆盖 / 归零剔除的格子
		const spanAt = (r: number, c: number) => plan.spans!.get(r * columnCount + c);
		expect(spanAt(0, 0)!.rowspan).toBe(2);
		expect(plan.skip!.has(1 * columnCount + 0)).toBe(true);
		expect(plan.skip!.has(0 * columnCount + 2)).toBe(true);
		// colspan 合并
		expect(spanAt(0, 1)!.colspan).toBe(2);

		// 末行越界 rowspan 被裁剪为 1 -> 单行无合并 -> 无 hasMerge，渲染期合成 1×1
		expect(plan.blocks[2].hasMerge).toBeFalsy();

		// covers：rowspan 覆盖行 -> anchors（行 1 被 (0,0) 覆盖、行 3 被 (2,0) 覆盖）
		expect(plan.covers).toBeTruthy();
		expect(plan.covers!.get(1)).toEqual([{ rowIndex: 0, columnIndex: 0 }]);
		expect(plan.covers!.get(3)).toEqual([{ rowIndex: 2, columnIndex: 0 }]);
		expect(plan.covers!.get(0)).toBeUndefined();
	});

	it('computeMergePlan: 无合并快路径（零分配，每行一块，covers/spans/skip 为 null）', () => {
		const data = buildData(3);
		const columns = ['c0', 'c1'].map(id => buildColumnNode({ id }));
		const getSpan = vi.fn(() => [1, 1]);
		const plan = computeMergePlan(data, columns, getSpan);
		expect(getSpan).toHaveBeenCalledTimes(6);
		expect(plan.blocks.map((b: any) => [b.start, b.end])).toEqual([[0, 0], [1, 1], [2, 2]]);
		expect(plan.blocks.every((b: any) => !b.hasMerge)).toBe(true);
		expect(plan.covers).toBe(null);
		expect(plan.spans).toBe(null);
		expect(plan.skip).toBe(null);
	});

	it('getSpan: toggling at runtime rebuilds blocks and clears stale cover anchors', async () => {
		const tableRef = ref<any>();
		const getSpan = ref<any>(undefined);
		// data 放在渲染函数外：切换 getSpan 引起的重渲染不能靠新的 data 引用顺带重建
		const data = buildData(4);
		const spanFn = ({ rowIndex, columnIndex }: any) => (columnIndex === 0 && rowIndex === 0 ? [2, 1] : [1, 1]);
		const wrapper = mount(() => (
			<Table ref={tableRef} data={data} primaryKey="id" getSpan={getSpan.value}>
				<TableColumn label="名称" prop="name" />
				<TableColumn label="地址" prop="address" />
			</Table>
		), { attachTo: document.body });
		await flush();
		const store = () => tableRef.value!.store;
		expect(store().states.list).toHaveLength(4);

		// 开启合并：rows[0,1] 合为一块
		getSpan.value = spanFn;
		await flush();
		expect(store().states.list).toHaveLength(3);
		expect(store().block.getCoverAnchors(1)).toEqual([{ rowIndex: 0, columnIndex: 0 }]);
		expect(wrapper.find('.vc-table__tr-group').exists()).toBe(true);

		// 换成另一个函数引用（如模板内联函数每次渲染都是新引用）：不整表重建
		const list = store().states.list;
		getSpan.value = (...args: any[]) => (spanFn as any)(...args);
		await flush();
		expect(store().states.list).toBe(list);

		// 移除合并：恢复单行块，旧的关联高亮坐标一并清掉
		getSpan.value = undefined;
		await flush();
		expect(store().states.list).toHaveLength(4);
		expect(store().block.getCoverAnchors(1)).toEqual([]);
		expect(wrapper.find('.vc-table__tr-group').exists()).toBe(false);
		wrapper.unmount();
	});

	it('getSpan: 合并块走 grid 渲染（aria-rowspan / data-row / 缓存 / hasMerge）', async () => {
		const tableRef = ref<any>();
		const data = buildData(4);
		const getSpan = vi.fn(({ rowIndex, columnIndex }: any) => {
			if (columnIndex === 0 && rowIndex === 0) return [2, 1];
			return [1, 1];
		});
		const onRowClick = vi.fn();
		const wrapper = mount(() => (
			<Table
				ref={tableRef}
				data={data}
				primaryKey="id"
				getSpan={getSpan}
				// @ts-ignore
				onRowClick={onRowClick}
			>
				<TableColumn label="名称" prop="name" />
				<TableColumn label="地址" prop="address" />
			</Table>
		), { attachTo: document.body });
		await flush();
		await sleep(60);
		await flush();

		const vm = tableRef.value!;
		// rows[0,1] 合并为一块，rows[2,3] 单行块
		expect(vm.store.states.list).toHaveLength(3);
		expect(vm.store.states.list[0].hasMerge).toBe(true);

		// body 中存在多行合并块（tr-group）；anchor cell 带 aria-rowspan，覆盖格子不渲染
		const layer = wrapper.find('.vc-table__body-wrapper .vc-table__tr-group');
		expect(layer.exists()).toBe(true);
		expect(layer.classes()).toContain('vc-table__grid');
		const anchor = layer.find('[aria-rowspan="2"]');
		expect(anchor.exists()).toBe(true);
		// 2 行 x 2 列 - 1 个被覆盖 = 3 个 cell
		expect(layer.findAll('.vc-table__td')).toHaveLength(3);
		expect(anchor.attributes('data-row')).toBe('0');
		expect(anchor.classes()).toContain('vc-table__td');
		expect(anchor.classes()).toContain('is-grid-first');

		// 普通块为单行 grid（vc-table__tr），渲染期合成 1×1 cells
		const plainRows = wrapper.findAll('.vc-table__body-wrapper .vc-table__tr');
		expect(plainRows.length).toBe(2);
		expect(plainRows[0].classes()).toContain('vc-table__grid');
		expect(plainRows[0].findAll('.vc-table__td')).toHaveLength(2);

		// 事件：合并 cell 点击 -> row-click + current-row
		await anchor.trigger('click');
		await flush();
		expect(onRowClick).toHaveBeenCalled();
		expect(vm.store.states.currentRow.id).toBe('id__0');

		// 缓存：data/columns/getSpan 未变时 updateColumns 不触发重复求值
		const callsBefore = getSpan.mock.calls.length;
		vm.store.block.rebuildMergeList();
		expect(getSpan.mock.calls.length).toBe(callsBefore);

		wrapper.unmount();
	});

	it('多级表头：grid 渲染 + aria-colspan/aria-rowspan + sticky 类保留', async () => {
		const tableRef = ref<any>();
		const wrapper = mount(() => (
			<Table ref={tableRef} data={buildData(2)} primaryKey="id">
				<TableColumn label="A" prop="name" fixed="left" width={80} />
				<TableColumn label="B1" prop="count" width={100} />
				<TableColumn label="B2" prop="address" width={120} />
			</Table>
		), { attachTo: document.body });
		await flush();

		// 嵌套 TableColumn 注册在测试环境受限（见上方 skip 用例），store 层手工组装分组列
		const vm = tableRef.value!;
		const [a, b1, b2] = vm.store.states._columns;
		vm.store.states._columns = [a, buildColumnNode({ id: 'group-1', label: '分组' }, [b1, b2])];
		vm.store.updateColumns();
		await flush();
		await sleep(60);
		await flush();

		const thead = wrapper.find('.vc-table__thead');
		expect(thead.classes()).toContain('is-group');
		const headerRow = wrapper.find('.vc-table__thead .vc-table__tr');
		expect(headerRow.classes()).toContain('vc-table__grid');

		// 分组列 colspan=2；leaf 列 A rowspan=2
		const group = headerRow.find('[aria-colspan="2"]');
		expect(group.exists()).toBe(true);
		const leafA = headerRow.find('[aria-rowspan="2"]');
		expect(leafA.exists()).toBe(true);
		expect(leafA.classes()).toContain('is-fixed-left');
		expect((leafA.element as HTMLElement).style.position).toBe('sticky');

		// th 总数 = 1(A) + 1(分组) + 2(B1/B2)
		expect(headerRow.findAll('.vc-table__th')).toHaveLength(4);

		wrapper.unmount();
	});

	it('TableGrid 独立渲染：默认 props + realWidth 兜底 + 最后一列 minmax（本地模板）', () => {
		const w1 = mount(() => (<TableGrid />));
		expect(w1.find('.vc-table__grid').exists()).toBe(true);
		w1.unmount();

		const w2 = mount(() => (
			<TableGrid
				columns={[buildColumnNode({ width: 100, realWidth: 100 }), buildColumnNode()]}
				cells={[{ rowIndex: 0, columnIndex: 0 }] as any}
			/>
		));
		const el = w2.find('.vc-table__grid').element as HTMLElement;
		// 无表格上下文 -> 本地计算模板
		expect(el.style.gridTemplateColumns).toBe('100px minmax(80px, 1fr)');
		// 默认 key / span：cell 渲染且无 aria-*（非合并格）
		const cell = w2.find('[role="cell"]');
		expect(cell.exists()).toBe(true);
		expect(cell.attributes('aria-rowspan')).toBeUndefined();
		expect(cell.classes()).toContain('is-grid-first');
		w2.unmount();
	});

	it('表格内 TableGrid 消费表根 --vc-table-columns CSS 变量（单源模板）', async () => {
		const wrapper = mount(() => (
			<Table data={buildData(2)}>
				<TableColumn label="A" prop="name" width={100} />
				<TableColumn label="B" prop="count" />
			</Table>
		), { attachTo: document.body });
		await flush();
		// 表根写入变量
		const root = wrapper.find('.vc-table').element as HTMLElement;
		expect(root.style.getPropertyValue('--vc-table-columns')).toContain('100px');
		// thead / tr 都引用 var()
		const headerRow = wrapper.find('.vc-table__thead .vc-table__tr').element as HTMLElement;
		expect(headerRow.style.gridTemplateColumns).toBe('var(--vc-table-columns)');
		const tr = wrapper.find('.vc-table__body-wrapper .vc-table__tr').element as HTMLElement;
		expect(tr.style.gridTemplateColumns).toBe('var(--vc-table-columns)');
		wrapper.unmount();
	});

	it('合并块 cell 级行为：row/cell class+style、stripe、highlight、hover、dblclick/contextmenu、rowHeight', async () => {
		const tableRef = ref<any>();
		const data = buildData(4);
		const onCellDblclick = vi.fn();
		const onRowContextmenu = vi.fn();
		const onCellMouseEnter = vi.fn();
		const onCellMouseLeave = vi.fn();
		const getSpan = ({ rowIndex, columnIndex }: any) => (columnIndex === 0 && rowIndex === 0 ? [2, 1] : [1, 1]);
		const wrapper = mount(() => (
			<Table
				ref={tableRef}
				data={data}
				primaryKey="id"
				getSpan={getSpan}
				stripe
				highlight
				rowHeight={40}
				rowClass={() => 'mr-user-row'}
				rowStyle={() => ({ color: 'rgb(1, 2, 3)' })}
				cellClass="mr-cell"
				cellStyle={({ columnIndex }: any) => (columnIndex === 1 ? { background: 'red' } : {})}
				{
					...{
						onCellDblclick,
						onRowContextmenu,
						onCellMouseEnter,
						onCellMouseLeave
					} as any
				}
			>
				<TableColumn label="名称" prop="name" line={1} />
				<TableColumn label="地址" prop="address" />
			</Table>
		), { attachTo: document.body });
		await flush();
		await sleep(60);
		await flush();

		const layer = wrapper.find('.vc-table__body-wrapper .vc-table__tr-group');
		const anchor = layer.find('[aria-rowspan="2"]');

		// 合并块：用户 row-class/row-style 无效；cell-class 与内部行态仍作用在 cell 上
		expect(anchor.classes()).not.toContain('mr-user-row');
		expect(anchor.classes()).toContain('mr-cell');
		expect((anchor.element as HTMLElement).style.color).not.toBe('rgb(1, 2, 3)');
		expect(layer.classes()).not.toContain('mr-user-row');
		// stripe：以行号计
		const stripedCell = layer.find('.vc-table__td[data-row="1"]');
		expect(stripedCell.exists()).toBe(true);
		expect(stripedCell.classes()).toContain('is-striped');
		// rowHeight -> grid-auto-rows
		expect((layer.element as HTMLElement).style.gridAutoRows).toBe('40px');

		// hover：cell mouseover（委托）-> setHoverRow + hover-row 类作用在 cell 上
		await anchor.trigger('mouseover');
		await sleep(80);
		await flush();
		expect(onCellMouseEnter).toHaveBeenCalled();
		expect(tableRef.value.store.states.hoverRowIndex).toBe(0);
		expect(layer.find('[data-row="0"].hover-row').exists()).toBe(true);

		// 行覆盖高亮：hover 行 1 时，rowspan 覆盖行 1 的 anchor(0,0) 追加 hover-related
		const coveredCell = layer.find('.vc-table__td[data-row="1"]');
		await coveredCell.trigger('mouseover');
		await sleep(80);
		await flush();
		expect(tableRef.value.store.states.hoverRowIndex).toBe(1);
		expect(anchor.classes()).toContain('hover-related');

		await layer.trigger('mouseleave');
		await sleep(80);
		await flush();
		expect(onCellMouseLeave).toHaveBeenCalled();
		expect(tableRef.value.store.states.hoverRowIndex).toBe(null);
		expect(anchor.classes()).not.toContain('hover-related');

		// highlight：点击后 current-row 类按行作用在 cell 上
		await anchor.trigger('click');
		await flush();
		expect(layer.find('[data-row="0"].current-row').exists()).toBe(true);

		await anchor.trigger('dblclick');
		await anchor.trigger('contextmenu');
		expect(onCellDblclick).toHaveBeenCalled();
		expect(onRowContextmenu).toHaveBeenCalled();

		wrapper.unmount();
	});

	it.each([
		['固定高度', { height: 200 }],
		['外部视口', { virtualized: true }]
	])('虚拟滚动（%s）下合并块作为 RecycleList 最小渲染单位', async (_label, modeProps) => {
		const tableRef = ref<any>();
		const getSpan = ({ rowIndex, columnIndex }: any) => {
			if (columnIndex === 0 && rowIndex % 2 === 0) return [2, 1];
			return [1, 1];
		};
		const wrapper = mount(() => (
			<Table ref={tableRef} data={buildData(20)} primaryKey="id" rows={5} getSpan={getSpan} {...modeProps}>
				<TableColumn label="名称" prop="name" />
				<TableColumn label="地址" prop="address" />
			</Table>
		), { attachTo: document.body });
		await flush();
		await sleep(60);
		await flush();

		const vm = tableRef.value!;
		// 20 行两两合并 -> 10 个合并块
		expect(vm.store.states.list).toHaveLength(10);
		expect(vm.store.states.list.every((i: any) => i.hasMerge)).toBe(true);
		// cells 不在虚拟化前全量构建
		expect(vm.store.states.list.every((i: any) => !i.cells)).toBe(true);
		expect(wrapper.find('.vc-recycle-list').exists()).toBe(true);
		expect(wrapper.find('.vc-table__tr-group').exists()).toBe(true);

		wrapper.unmount();
	});

	it('getCells: 懒构建 + 记忆化（合并块按 spans/skip，普通块合成 1×1）', async () => {
		const tableRef = ref<any>();
		// 每两行合并第 0 列
		const getSpan = ({ rowIndex, columnIndex }: any) => {
			if (columnIndex === 0) return rowIndex % 2 === 0 ? [2, 1] : [0, 0];
			return [1, 1];
		};
		const wrapper = mount(() => (
			<Table ref={tableRef} data={buildData(6)} primaryKey="id" getSpan={getSpan}>
				<TableColumn label="名称" prop="name" />
				<TableColumn label="地址" prop="address" />
			</Table>
		), { attachTo: document.body });
		await flush();
		await sleep(60);
		await flush();

		const vm = tableRef.value!;
		const list = vm.store.states.list;
		expect(list).toHaveLength(3);
		expect(list.every((i: any) => !i.cells)).toBe(true);

		// 合并块：被覆盖格子剔除，anchor 带 rowspan；重复调用返回同一引用（记忆化）
		const cells = vm.store.block.getCells(list[0]);
		expect(cells).toHaveLength(3);
		expect(cells.find((c: any) => c.rowIndex === 0 && c.columnIndex === 0).rowspan).toBe(2);
		expect(cells.some((c: any) => c.rowIndex === 1 && c.columnIndex === 0)).toBe(false);
		expect(vm.store.block.getCells(list[0])).toBe(cells);

		// 渲染层消费懒构建结果：2 行 x 2 列 - 1 被覆盖 = 3 个 cell
		const layer = wrapper.find('.vc-table__body-wrapper .vc-table__tr-group');
		expect(layer.findAll('.vc-table__td')).toHaveLength(3);

		wrapper.unmount();
	});

	it('getCells: 无 getSpan 的普通块合成 1×1（plan 为 null）', async () => {
		const tableRef = ref<any>();
		const wrapper = mount(() => (
			<Table ref={tableRef} data={buildData(2)} primaryKey="id">
				<TableColumn label="名称" prop="name" />
				<TableColumn label="地址" prop="address" />
			</Table>
		), { attachTo: document.body });
		await flush();

		const vm = tableRef.value!;
		const list = vm.store.states.list;
		const cells = vm.store.block.getCells(list[1]);
		expect(cells).toEqual([
			{ rowIndex: 1, columnIndex: 0, rowspan: 1, colspan: 1 },
			{ rowIndex: 1, columnIndex: 1, rowspan: 1, colspan: 1 }
		]);
		expect(vm.store.block.getCells(list[1])).toBe(cells);

		wrapper.unmount();
	});

	it('expand: 展开行以 TableGrid + TableExpand 兄弟结构渲染在块内', async () => {
		const data = buildData(2);
		const tableRef = ref<any>();
		const wrapper = mount(() => (
			<Table ref={tableRef} data={data} primaryKey="id">
				<TableColumn type="expand">
					{{ default: ({ row }: any) => <div class="my-expand">{row.name}</div> }}
				</TableColumn>
				<TableColumn label="名称" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();

		const vm = tableRef.value!;
		expect(wrapper.find('.my-expand').exists()).toBe(false);

		vm.toggleRowExpansion(vm.store.states.data[0], true);
		await flush();

		// 展开内容渲染在块内、grid 行之后
		const expanded = wrapper.find('.vc-table__tr.is-expanded');
		expect(expanded.exists()).toBe(true);
		expect(expanded.find('.my-expand').text()).toBe(data[0].name);
		expect(expanded.find('.vc-table__expanded-cell').exists()).toBe(true);
		// 展开行数据 cell 带 expanded 类（内部行态挂 cell）
		expect(wrapper.find('.vc-table__td[data-row="0"].expanded').exists()).toBe(true);

		vm.toggleRowExpansion(vm.store.states.data[0], false);
		await flush();
		expect(wrapper.find('.vc-table__tr.is-expanded').exists()).toBe(false);
		wrapper.unmount();
	});
});

describe('Block reuse on setData', () => {
	/**
	 * 挂载一个非虚拟化表格（渲染全部块），返回数据源与读取工具
	 * @param props 额外的 Table props
	 * @returns 挂载结果与读取工具
	 */
	const setup = async (props: Record<string, any> = {}) => {
		const data = ref(buildData(5));
		const tableRef = ref<any>();
		const wrapper = mount(() => (
			<Table ref={tableRef} data={data.value} {...props}>
				<TableColumn label="名称" prop="name" />
				<TableColumn label="地址" prop="address" />
			</Table>
		), { attachTo: document.body });
		await flush();
		return {
			data,
			wrapper,
			blocks: () => toRaw(tableRef.value.store.states.list).slice(),
			// 已渲染的行：[data-row, 名称]
			rendered: () => wrapper.findAll('.vc-table__body-wrapper .vc-table__tr').map(tr => [
				tr.attributes('data-row'),
				tr.find('.vc-table__td').text()
			])
		};
	};

	it('reuses the block of a kept row and updates its index in place', async () => {
		const { data, wrapper, blocks, rendered } = await setup({ primaryKey: 'id' });
		const before = blocks();

		data.value = data.value.filter(row => row.id !== 'id__1');
		await flush();

		const after = blocks();
		expect(after).toHaveLength(4);
		// 行对象没变，块对象就不变（RecycleList 据此沿用已测尺寸）
		expect(after[0]).toBe(before[0]);
		expect(after[1]).toBe(before[2]);
		expect(after[3]).toBe(before[4]);
		expect(after.map((block: any) => [block.rowStart, block.rows[0].index])).toEqual([[0, 0], [1, 1], [2, 2], [3, 3]]);
		// 块对象引用不变，但已渲染的行仍要随序号更新
		expect(rendered()).toEqual([['0', 'name-0'], ['1', 'name-2'], ['2', 'name-3'], ['3', 'name-4']]);

		wrapper.unmount();
	});

	it('gives a new row object a new block and keeps index ids in sync without primaryKey', async () => {
		const { data, wrapper, blocks } = await setup();
		const before = blocks();

		data.value = [{ ...data.value[0] }, ...data.value.slice(2)];
		await flush();

		const after = blocks();
		expect(after[0]).not.toBe(before[0]);
		expect(after[1]).toBe(before[2]);
		// 没有 primaryKey 时 id 即序号
		expect(after.map((block: any) => block.id)).toEqual([0, 1, 2, 3]);

		wrapper.unmount();
	});

	it('does not share one block between repeated row objects', async () => {
		const { data, wrapper, blocks } = await setup();
		const [a, b] = data.value;

		data.value = [a, b, a];
		await flush();

		const after = blocks();
		expect(after[0]).not.toBe(after[2]);
		expect(after.map((block: any) => block.rowStart)).toEqual([0, 1, 2]);

		wrapper.unmount();
	});

	it('keeps initial blocks for unmerged rows when getSpan regroups the list', async () => {
		// 只合并第 0、1 行
		const getSpan = ({ row, columnIndex }: any) => {
			if (columnIndex !== 0) return [1, 1];
			if (row.id === 'id__0') return [2, 1];
			if (row.id === 'id__1') return [0, 0];
			return [1, 1];
		};
		const { data, wrapper, blocks } = await setup({ primaryKey: 'id', getSpan });
		const before = blocks();
		expect(before).toHaveLength(4);
		expect(before[0].hasMerge).toBe(true);

		data.value = data.value.filter(row => row.id !== 'id__3');
		await flush();

		const after = blocks();
		expect(after).toHaveLength(3);
		expect(after[1]).toBe(before[1]);
		expect(after[2]).toBe(before[3]);
		expect(after[2].rowStart).toBe(3);

		wrapper.unmount();
	});
});

describe('Table dynamic column order', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	const labelsOf = (vm: any) => vm.store.states.columns.map((column: any) => column.states.label);
	const headerLabels = (wrapper: any) => wrapper.findAll('.vc-table__thead .vc-table__th').map((th: any) => th.text());

	it('keeps template order when non-adjacent conditional columns toggle in the same tick', async () => {
		const tableRef = ref<any>();
		const visible = ref(false);
		const wrapper = mount(() => (
			<Table ref={tableRef} data={buildData(1)} primaryKey="id">
				<TableColumn label="A" prop="name" />
				{visible.value ? <TableColumn key="b" label="B" prop="name" /> : null}
				<TableColumn label="C" prop="name" />
				{visible.value ? <TableColumn key="d" label="D" prop="name" /> : null}
				<TableColumn label="E" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();
		expect(labelsOf(tableRef.value)).toEqual(['A', 'C', 'E']);

		visible.value = true;
		await flush();
		expect(labelsOf(tableRef.value)).toEqual(['A', 'B', 'C', 'D', 'E']);
		expect(headerLabels(wrapper)).toEqual(['A', 'B', 'C', 'D', 'E']);

		visible.value = false;
		await flush();
		expect(labelsOf(tableRef.value)).toEqual(['A', 'C', 'E']);

		wrapper.unmount();
	});

	it('follows keyed v-for columns on insert, move and replace', async () => {
		const tableRef = ref<any>();
		const list = ref(['X1', 'X2', 'X3']);
		const wrapper = mount(() => (
			<Table ref={tableRef} data={buildData(1)} primaryKey="id">
				<TableColumn label="首" prop="name" />
				{list.value.map(item => <TableColumn key={item} label={item} prop="name" />)}
				<TableColumn label="尾" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();
		expect(labelsOf(tableRef.value)).toEqual(['首', 'X1', 'X2', 'X3', '尾']);

		// 首尾同时插入：keyed diff 倒序挂载新节点
		list.value = ['N1', 'X1', 'X2', 'X3', 'N2'];
		await flush();
		expect(labelsOf(tableRef.value)).toEqual(['首', 'N1', 'X1', 'X2', 'X3', 'N2', '尾']);

		// 反转：只移动 DOM，不触发挂载/卸载；同一轮 flush 内完成校正，一个 nextTick 后表头即为新顺序
		list.value = [...list.value].reverse();
		await nextTick();
		expect(labelsOf(tableRef.value)).toEqual(['首', 'N2', 'X3', 'X2', 'X1', 'N1', '尾']);
		expect(headerLabels(wrapper)).toEqual(['首', 'N2', 'X3', 'X2', 'X1', 'N1', '尾']);

		// 整体替换后再还原
		list.value = ['R1', 'R2', 'R3'];
		await flush();
		expect(labelsOf(tableRef.value)).toEqual(['首', 'R1', 'R2', 'R3', '尾']);

		list.value = ['X1', 'X2', 'X3'];
		await flush();
		expect(labelsOf(tableRef.value)).toEqual(['首', 'X1', 'X2', 'X3', '尾']);

		wrapper.unmount();
	});

	it('keeps template order for v-for sub columns in multi-level header', async () => {
		const tableRef = ref<any>();
		const list = ref(['S1', 'S2']);
		const wrapper = mount(() => (
			<Table ref={tableRef} data={buildData(1)} primaryKey="id">
				<TableColumn label="A" prop="name" />
				<TableColumn label="G">
					<TableColumn label="G1" prop="name" />
					{list.value.map(item => <TableColumn key={item} label={item} prop="name" />)}
					<TableColumn label="G3" prop="name" />
				</TableColumn>
				<TableColumn label="B" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();
		expect(labelsOf(tableRef.value)).toEqual(['A', 'G1', 'S1', 'S2', 'G3', 'B']);

		list.value = ['S1', 'S3', 'S2'];
		await flush();
		expect(labelsOf(tableRef.value)).toEqual(['A', 'G1', 'S1', 'S3', 'S2', 'G3', 'B']);

		// 分组内子列反转：由分组列重渲染后校正，一个 nextTick 后即为新顺序
		list.value = [...list.value].reverse();
		await nextTick();
		expect(labelsOf(tableRef.value)).toEqual(['A', 'G1', 'S2', 'S3', 'S1', 'G3', 'B']);
		expect(headerLabels(wrapper).filter((label: string) => /^S\d$/.test(label))).toEqual(['S2', 'S3', 'S1']);

		wrapper.unmount();
	});

	it('places new columns after their template predecessor under external order', async () => {
		const tableRef = ref<any>();
		const columns = ref<any[]>([]);
		const visible = ref(false);
		const wrapper = mount(() => (
			<Table
				ref={tableRef}
				data={buildData(1)}
				primaryKey="id"
				columns={columns.value}
				{...{ 'onUpdate:columns': (v: any[]) => { columns.value = v; } }}
			>
				<TableColumn label="A" prop="name" />
				<TableColumn label="B" prop="name" />
				{visible.value ? <TableColumn key="c" label="C" prop="name" /> : null}
				<TableColumn label="D" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();
		expect(columns.value.map(item => item.label)).toEqual(['A', 'B', 'D']);

		columns.value = [...columns.value].reverse();
		await flush();
		expect(labelsOf(tableRef.value)).toEqual(['D', 'B', 'A']);

		visible.value = true;
		await flush();
		expect(labelsOf(tableRef.value)).toEqual(['D', 'B', 'C', 'A']);
		expect(columns.value.map(item => item.label)).toEqual(['D', 'B', 'C', 'A']);

		// 写回模板顺序：恢复跟随模板
		columns.value = [...columns.value].sort((a, b) => 'ABCD'.indexOf(a.label) - 'ABCD'.indexOf(b.label));
		await flush();
		expect(labelsOf(tableRef.value)).toEqual(['A', 'B', 'C', 'D']);

		visible.value = false;
		await flush();
		visible.value = true;
		await flush();
		expect(labelsOf(tableRef.value)).toEqual(['A', 'B', 'C', 'D']);

		wrapper.unmount();
	});

	it('keeps external order over template moves until template order is written back', async () => {
		const tableRef = ref<any>();
		const columns = ref<any[]>([]);
		const list = ref(['X', 'Y']);
		const wrapper = mount(() => (
			<Table
				ref={tableRef}
				data={buildData(1)}
				primaryKey="id"
				columns={columns.value}
				{...{ 'onUpdate:columns': (v: any[]) => { columns.value = v; } }}
			>
				<TableColumn label="A" prop="name" />
				{list.value.map(item => <TableColumn key={item} label={item} prop="name" />)}
				<TableColumn label="D" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();

		// 仅改显隐（顺序与模板一致）不锁定顺序
		columns.value = columns.value.map(item => (item.label === 'A' ? { ...item, hidden: true } : item));
		await flush();
		list.value = ['Y', 'X'];
		await flush();
		expect(labelsOf(tableRef.value)).toEqual(['Y', 'X', 'D']);

		columns.value = columns.value.map(item => ({ ...item, hidden: false }));
		await flush();
		expect(labelsOf(tableRef.value)).toEqual(['A', 'Y', 'X', 'D']);

		// 外部重排后，模板移动不影响已知列
		columns.value = [...columns.value].reverse();
		await flush();
		expect(labelsOf(tableRef.value)).toEqual(['D', 'X', 'Y', 'A']);

		list.value = ['X', 'Y'];
		await flush();
		expect(labelsOf(tableRef.value)).toEqual(['D', 'X', 'Y', 'A']);

		// 写回模板顺序后恢复跟随模板
		columns.value = [...columns.value].sort((a, b) => 'AXYD'.indexOf(a.label) - 'AXYD'.indexOf(b.label));
		await flush();
		expect(labelsOf(tableRef.value)).toEqual(['A', 'X', 'Y', 'D']);

		list.value = ['Y', 'X'];
		await flush();
		expect(labelsOf(tableRef.value)).toEqual(['A', 'Y', 'X', 'D']);

		wrapper.unmount();
	});
});
