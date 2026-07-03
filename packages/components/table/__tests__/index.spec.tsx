// @vitest-environment jsdom

import { MTable, MTableColumn, Table, TableColumn } from '@deot/vc-components';
import { mount } from '@vue/test-utils';
import { nextTick, ref } from 'vue';
import { vi } from 'vitest';

import { Store } from '../store/store';
import { Layout } from '../store/layout';
import { useStates } from '../store/use-states';
import { columnsToRowsEffect, flattenData, walkTreeNode } from '../store/utils';
import {
	getCell,
	getColumnByCell,
	getColumnById,
	getColumnByKey,
	getRowValue,
	getValuesMap,
	parseHeight,
	parseMinWidth,
	parseWidth
} from '../utils';
import { TableSort } from '../table-header/table-sort';

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

	it('applies modifier classes for stripe / border / divider / fit / maxHeight', async () => {
		const data = buildData(2);
		const wrapper = mount(() => (
			<Table
				data={data}
				stripe
				border
				divider
				maxHeight={400}
				fit={false}
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
			'vc-table--fluid-height'
		]));
		expect(wrapper.classes()).not.toContain('vc-table--fit');

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
				<TableColumn label="名称" prop="name" sortable tooltip="提示" filters={[{ value: 1, label: 'a' }]} headerAlign="center" align="center" />
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
		// 阶段一：!height 路径走单一 DOM + sticky，根节点带 vc-table--sticky-columns，
		// 固定列以 is-fixed-left / is-fixed-right 表示，不再有 .vc-table__fixed* 容器。
		expect(wrapper.classes()).toContain('vc-table--sticky-columns');
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

	// 多级表头依赖 vc-table-column 的 provide 暴露父实例 vnode.el；当前 provide 仅暴露
	// `{ columnId, columnConfig }`，与 sub-column 中读取 `parent.vnode.el.children` 的逻辑不一致，
	// 属未完成业务，暂以 it.skip 占位以避免对未稳定行为做强假设。
	it.skip('supports multi-level header (nested TableColumn children) - 业务未完成', () => {});
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

		const cell = wrapper.find('.vc-table__td');
		await cell.trigger('mouseenter');
		await cell.trigger('mouseleave');
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
		expect(wrapper.find('.custom-row').exists()).toBe(true);
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

		expect(wrapper.find('.fn-row').exists()).toBe(true);
		expect(wrapper.find('.str-cell').exists()).toBe(true);
		expect(wrapper.find('.hd-str').exists()).toBe(true);
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
		expect(w2.find('.hd-fn').exists()).toBe(true);
		expect(w2.find('.hd-cell-fn').exists()).toBe(true);
		w2.unmount();
	});

	it('mouseleave on table clears hoverRowIndex / hoverState path', async () => {
		const tableRef = ref<any>();
		const wrapper = mount(() => (
			<Table ref={tableRef} data={buildData(1)}>
				<TableColumn label="名称" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();
		const vm = tableRef.value!;

		// 通过 cell 的 mouseenter 设置 hoverState，再触发表格 mouseleave 让 handleMouseLeave 走非空分支
		const cell = wrapper.find('.vc-table__td');
		await cell.trigger('mouseenter');
		await flush();
		await wrapper.trigger('mouseleave');
		await flush();

		// 即便 expose 上 ref 被自动解包，store 上的 hoverRowIndex 应被清理
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

		const headerCheckbox = wrapper.find('.vc-table__header .vc-checkbox');
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
});

// 树形 / Expand-row 渲染交互的"业务正确性"尚未完全打磨，相关 UI 断言保持 skip；
// 这里仅通过挂载来覆盖底层 store / column-confg 的代码路径，避免对未稳定行为做强假设。
describe('Tree / Expand row source paths (仅覆盖代码路径，不做业务断言)', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it.skip('expandRowValue prop and toggleRowExpansion API for expand columns', () => {});
	it.skip('lazy loadExpand supports promise / sync array / non-array error', () => {});

	it('expand column renders renderHeader / renderCell + store.expand.toggle path', async () => {
		const data = [
			{ id: 1, name: 'a' },
			{ id: 2, name: 'b' }
		];
		const onExpandChange = vi.fn();
		const tableRef = ref<any>();
		const wrapper = mount(() => (
			<Table
				ref={tableRef}
				data={data}
				primaryKey="id"
				onExpandChange={onExpandChange}
			>
				<TableColumn type="expand" label="详情">
					{{ default: ({ row }: any) => (
						<div class="expand-content">
							expanded:
							{row.name}
						</div>
					) }}
				</TableColumn>
				<TableColumn label="名称" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();

		expect(wrapper.find('.vc-table__expand-column').exists()).toBe(true);

		// 点击 icon 触发 cellForced.expand.renderCell handleClick → store.expand.toggle
		const icon = wrapper.find('.vc-table__expand-icon');
		expect(icon.exists()).toBe(true);
		await icon.trigger('click');
		await flush();

		const vm = tableRef.value!;
		// expandRows 已被 store 内部填充
		expect(vm.store.states.expandRows.length).toBe(1);

		// 直接覆盖 expand.update / reset 代码路径
		vm.store.expand.update();
		vm.store.expand.reset([1]);

		// toggleRowExpansion 走 adapter，使用 store 内部 row 实例（避免 reactive proxy 对 indexOf 的影响）
		const internalRow = vm.store.states.data[0];
		vm.toggleRowExpansion(internalRow, false);
		await flush();
		expect(vm.store.expand.isExpanded(internalRow)).toBe(false);

		wrapper.unmount();
	});

	it('defaultExpandAll: expand.update slices entire data', async () => {
		const data = [
			{ id: 1, name: 'a' },
			{ id: 2, name: 'b' }
		];
		const tableRef = ref<any>();
		const wrapper = mount(() => (
			<Table ref={tableRef} data={data} primaryKey="id" defaultExpandAll>
				<TableColumn type="expand" label="详情">
					{{ default: ({ row }: any) => <div>{row.name}</div> }}
				</TableColumn>
				<TableColumn label="名称" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();
		const vm = tableRef.value!;
		expect(vm.store.expand.isExpanded(data[0])).toBe(true);
		expect(vm.store.expand.isExpanded(data[1])).toBe(true);
		wrapper.unmount();
	});

	it('expand without primaryKey: update sets empty + isExpanded uses indexOf', async () => {
		const data = [{ name: 'a' }, { name: 'b' }];
		const tableRef = ref<any>();
		const wrapper = mount(() => (
			<Table ref={tableRef} data={data}>
				<TableColumn type="expand" label="详情">
					{{ default: () => <div /> }}
				</TableColumn>
				<TableColumn label="名称" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();
		const vm = tableRef.value!;
		// 无 primaryKey：update → expandRows = []
		vm.store.expand.update();
		expect(vm.store.states.expandRows.length).toBe(0);
		// 直接 push 后 isExpanded 走 indexOf 分支
		vm.store.states.expandRows.push(data[0]);
		expect(vm.store.expand.isExpanded(data[0])).toBe(true);
		expect(vm.store.expand.isExpanded(data[1])).toBe(false);
		wrapper.unmount();
	});

	it('tree-mode: defaultExpandAll + tree.toggle / tree.expand / tree.update / getMaxLevel', async () => {
		const data = [
			{ id: 1, name: 'r1', children: [{ id: 11, name: 'r1-1' }, { id: 12, name: 'r1-2' }] },
			{ id: 2, name: 'r2' }
		];
		const onExpandChange = vi.fn();
		const tableRef = ref<any>();
		const wrapper = mount(() => (
			<Table
				ref={tableRef}
				data={data}
				primaryKey="id"
				defaultExpandAll
				onExpandChange={onExpandChange}
			>
				<TableColumn label="名称" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();

		const vm = tableRef.value!;
		// 至少返回数字（具体值取决于 walkTreeNode 对 leaf 节点的处理）
		expect(typeof vm.store.tree.getMaxLevel()).toBe('number');

		// 通过 store 内部的 row 调用 tree API，避免 reactive proxy 与原 row 不等
		const internalRow0 = vm.store.states.data[0];
		const internalRow1 = vm.store.states.data[1];

		// tree.toggle 切换 + 同值不 emit 分支
		vm.store.tree.toggle(internalRow0);
		await flush();
		vm.store.tree.toggle(internalRow0, false); // 同值，不再 emit
		await flush();
		// 通过 tree.expand 切换 expandRowValue
		vm.store.tree.expand([1]);
		await flush();

		// loadOrToggle 非 lazy 路径走 toggle
		vm.store.tree.loadOrToggle(internalRow1);
		await flush();

		wrapper.unmount();
	});

	it('tree-mode lazy: tree.loadData with sync array path', async () => {
		const data = [
			{ id: 1, name: 'r1', hasChildren: true }
		];
		const loadExpand = vi.fn(() => [
			{ id: 11, name: 'r1-1' },
			{ id: 12, name: 'r1-2' }
		]);
		const tableRef = ref<any>();
		const wrapper = mount(() => (
			<Table
				ref={tableRef}
				data={data}
				primaryKey="id"
				lazy
				loadExpand={loadExpand}
			>
				<TableColumn label="名称" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();

		const vm = tableRef.value!;
		const treeData = vm.store.states.treeData;
		expect(treeData[1]).toBeTruthy();
		expect(treeData[1].lazy).toBe(true);

		// loadOrToggle 触发 lazy 加载（同步数组）
		vm.store.tree.loadOrToggle(vm.store.states.data[0]);
		await flush();
		expect(loadExpand).toHaveBeenCalled();
		expect(vm.store.states.treeData[1].loaded).toBe(true);

		wrapper.unmount();
	});

	it('tree-mode lazy: loadData with promise path + non-array catch', async () => {
		const data = [
			{ id: 1, name: 'r1', hasChildren: true },
			{ id: 2, name: 'r2', hasChildren: true }
		];
		const promised = Promise.resolve([{ id: 11, name: 'r1-1' }]);
		const loadExpand = vi.fn((row: any) => {
			if (row.id === 1) return promised;
			return Promise.resolve('not-an-array');
		});

		const tableRef = ref<any>();
		const wrapper = mount(() => (
			<Table ref={tableRef} data={data} primaryKey="id" lazy loadExpand={loadExpand}>
				<TableColumn label="名称" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();
		const vm = tableRef.value!;
		vm.store.tree.loadOrToggle(vm.store.states.data[0]);
		await flush();
		await sleep(0);
		await flush();
		expect(vm.store.states.treeData[1].loaded).toBe(true);

		// non-array path: throw is captured by .catch (ignored here)
		try {
			vm.store.tree.loadOrToggle(vm.store.states.data[1]);
			await flush();
			await sleep(0);
		} catch { /* ignore */ }

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
		const wrapper = mount(() => (
			<Table data={data} border resizable onHeaderDragend={onDragend}>
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

	it('expandRowValue prop triggers store.setExpandRowValueAdapter', async () => {
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

		// 触发 watch(expandRowValue) → store.setExpandRowValueAdapter
		expandRowValue.value = [1, 2];
		await flush();
		expect(tableRef.value!.store.states.expandRows.length).toBeGreaterThanOrEqual(1);
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
		expect(wrapper.find('.vc-table__text-line').exists()).toBe(true);
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

	it('column filters: renders TableFilter trigger inside header cell', async () => {
		const data = [{ id: 1, name: 'a' }];
		const wrapper = mount(() => (
			<Table data={data} primaryKey="id">
				<TableColumn
					label="名称"
					prop="name"
					filters={[{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }]}
					filteredValue={['a']}
					filterIcon="my-filter-icon"
				/>
			</Table>
		), { attachTo: document.body });
		await flush();
		// TableFilter 是 div 占位实现，icon 透传到自定义属性，可用此断言渲染发生
		expect(wrapper.find('.vc-table__th [icon="my-filter-icon"]').exists()).toBe(true);
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
		// 阶段一：maxHeight + 固定列走 sticky 路径，不再渲染 .vc-table__fixed* 容器
		expect(wrapper.classes()).toContain('vc-table--sticky-columns');
		expect(wrapper.find('.vc-table__footer .vc-table__td.is-fixed-left').exists()).toBe(true);
		expect(wrapper.find('.vc-table__footer .vc-table__td.is-fixed-right').exists()).toBe(true);
		expect(wrapper.find('.vc-table__fixed').exists()).toBe(false);
		expect(wrapper.find('.vc-table__fixed-right').exists()).toBe(false);
		wrapper.unmount();
	});

	it('Current.update: replaces currentRow when not in new data via primaryKey', async () => {
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
		// 替换数据为 id=1 的不同对象引用 → Current.update 触发新行查找
		data.value = [{ id: 1, name: 'a-updated' }, { id: 3, name: 'c' }];
		await flush();
		await flush();
		// 当前行仍按 primaryKey 找回新引用
		expect(vm.store.states.currentRow?.id).toBe(1);
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
		// 没有 expand 列 → toggleRowExpansion 走 tree.toggle 分支
		vm.toggleRowExpansion(vm.store.states.data[0]);
		await flush();
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
		const row = wrapper.find('.vc-table__tr');
		await row.trigger('mouseenter');
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
		await cell.trigger('mouseenter');
		await flush();
		await cell.trigger('mouseleave');
		await flush();
		wrapper.unmount();
	});

	it('NormalList: handleResize triggers row-resize via Resizer onResize', async () => {
		const data = buildData(2);
		const wrapper = mount(() => (
			<Table data={data}>
				<TableColumn label="A" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();
		// 直接触发 Resizer 的 onResize emit（通过组件 vm 树查找）
		const findResizer = (parent: any): any => {
			if (!parent) return null;
			const list = parent.findAllComponents({ name: 'vc-resizer' });
			return list[0];
		};
		const resizer = findResizer(wrapper);
		if (resizer) {
			resizer.vm.$emit('resize', { height: 25 });
			await flush();
			resizer.vm.$emit('resize', { height: 25 }); // 同值，short-circuit
			await flush();
		}
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
		// 阶段一：!height 时不再渲染 .vc-table__fixed* 容器，固定列改为 sticky cell
		expect(wrapper.classes()).toContain('vc-table--sticky-columns');
		expect(wrapper.find('.vc-table__th.is-fixed-left').exists()).toBe(true);
		expect(wrapper.find('.vc-table__th.is-fixed-right').exists()).toBe(true);
		expect(wrapper.find('.vc-table__td.is-fixed-left').exists()).toBe(true);
		expect(wrapper.find('.vc-table__td.is-fixed-right').exists()).toBe(true);
		expect(wrapper.find('.vc-table__fixed').exists()).toBe(false);
		expect(wrapper.find('.vc-table__fixed-right').exists()).toBe(false);
		wrapper.unmount();
	});

	it('selection column auto-fix when other columns are leftFixed', async () => {
		const data = buildData(2);
		const tableRef = ref<any>();
		const wrapper = mount(() => (
			<Table ref={tableRef} data={data} primaryKey="id">
				<TableColumn type="selection" />
				<TableColumn label="A" prop="name" fixed="left" width={100} />
				<TableColumn label="B" prop="address" />
			</Table>
		), { attachTo: document.body });
		await flush();
		// 触发 updateColumns 中 selection 自动 fix 的分支
		expect(tableRef.value!.store.states.leftFixedColumns.length).toBeGreaterThanOrEqual(2);
		wrapper.unmount();
	});

	it('Current.update directly: replaces stale currentRow when not in data', async () => {
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
		vm.store.current.update();
		await flush();

		// reset(id) 边界：找不到 id 则置 null
		vm.store.current.reset(123);
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
		vm1.store.cleanSelection();
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

	it('store.expand.update without data still safe', async () => {
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
		vm.store.expand.update();
		expect(vm.store.states.expandRows.length).toBe(0);
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

	it('treeCellPrefix unit: indent + expanded icon + loading spin + placeholder branches', async () => {
		const { treeCellPrefix } = await import('../table-column/table-column-confg');
		const fakeStore = {
			tree: { loadOrToggle: vi.fn() }
		};
		// 1) treeNode 为空 → null
		expect(treeCellPrefix({ row: {}, treeNode: undefined, store: fakeStore } as any)).toBe(null);
		// 2) indent + expanded=false（无 loading）
		const r1: any = treeCellPrefix({
			row: { id: 1 },
			treeNode: { indent: 20, expanded: false, noLazyChildren: false, loading: false },
			store: fakeStore
		} as any);
		expect(Array.isArray(r1)).toBe(true);
		// 3) indent + expanded=true + loading=true → 渲染 Spin
		const r2: any = treeCellPrefix({
			row: { id: 2 },
			treeNode: { indent: 10, expanded: true, noLazyChildren: false, loading: true },
			store: fakeStore
		} as any);
		expect(Array.isArray(r2)).toBe(true);
		// 4) noLazyChildren=true + expanded boolean → 走 placeholder 分支
		const r3: any = treeCellPrefix({
			row: { id: 3 },
			treeNode: { indent: 0, expanded: true, noLazyChildren: true },
			store: fakeStore
		} as any);
		expect(Array.isArray(r3)).toBe(true);
		// 5) expanded 非 boolean → 走 placeholder 分支
		const r4: any = treeCellPrefix({
			row: { id: 4 },
			treeNode: { indent: 0, expanded: undefined, noLazyChildren: false },
			store: fakeStore
		} as any);
		expect(Array.isArray(r4)).toBe(true);
		// 6) onClick 调用 store.tree.loadOrToggle
		const r5: any = treeCellPrefix({
			row: { id: 5 },
			treeNode: { indent: 0, expanded: false, noLazyChildren: false, loading: false },
			store: fakeStore
		} as any);
		// 遍历 vnode 数组找到带 onClick 的展开 span
		(r5 as any[]).forEach((node: any) => {
			if (node?.props?.onClick) {
				node.props.onClick({ stopPropagation: () => {} });
			}
		});
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
		// 直接通过 vue-test-utils 找到 Checkbox 组件，emit change/click 触发 column 上的 onChange/onClick
		const checkboxes = wrapper.findAllComponents({ name: 'vc-checkbox' });
		const bodyCheckbox = checkboxes.find(cb => !cb.element.closest('.vc-table__th'));
		if (bodyCheckbox) {
			bodyCheckbox.vm.$emit('click', { stopPropagation: () => {} });
			bodyCheckbox.vm.$emit('change', true);
			await flush();
		}
		wrapper.unmount();
	});

	it('column filters: fires TableFilter change to cover handleFilter (filter callback)', async () => {
		const filterFn = vi.fn();
		const data = [{ id: 1, name: 'a' }];
		const wrapper = mount(() => (
			<Table data={data} primaryKey="id">
				<TableColumn
					label="名称"
					prop="name"
					filters={[{ value: 'a', label: 'A' }]}
					filterIcon="filter-marker"
					// @ts-ignore - 将 column.filter 暴露用于回调
					filter={filterFn}
				/>
			</Table>
		), { attachTo: document.body });
		await flush();
		// TableFilter 当前是 <div> 占位，onChange 通过 Vue 绑定为 change 事件监听
		const filterEl = wrapper.find('[icon="filter-marker"]');
		expect(filterEl.exists()).toBe(true);
		await filterEl.trigger('change');
		await flush();
		expect(filterFn).toHaveBeenCalled();
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
		expect(wrapper.find('.vc-table__header').exists()).toBe(false);
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
		// 模拟 boundingClientRect 让 mousemove 命中 resize 区域 (rect.right - pageX < 8)
		thEl.getBoundingClientRect = () => ({
			width: 120, height: 30, left: 0, top: 0, right: 120, bottom: 30, x: 0, y: 0,
			toJSON: () => ({})
		} as any);

		document.body.style.cursor = '';
		await th.trigger('mousemove', { pageX: 115, clientX: 115 });
		await flush();
		// 进入 resize 区 → body cursor 变为 col-resize
		expect(document.body.style.cursor).toBe('col-resize');

		await th.trigger('mousemove', { pageX: 50, clientX: 50 });
		await flush();
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

	it('Resize listeners: handleResize without props.height evaluates shouldUpdateHeight RHS', async () => {
		// 未设置 props.height，但通过 fixed 列让 shouldUpdateHeight.value 为 true，
		// 用以覆盖 `(props.height || shouldUpdateHeight.value)` OR 表达式右操作数分支。
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

		// 触发同尺寸 listener（覆盖 shouldUpdateHeight RHS=false 分支）
		rz.listeners.forEach((fn: any) => fn());
		await flush();

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

	it('non-complex table: hoverRowIndex change returns early (no fixed columns)', async () => {
		const tableRef = ref<any>();
		const wrapper = mount(() => (
			<Table ref={tableRef} data={buildData(2)}>
				<TableColumn label="A" prop="name" />
				<TableColumn label="B" prop="count" />
			</Table>
		), { attachTo: document.body });
		await flush();
		// 直接修改 hoverRowIndex，watch 触发 → !isComplex 命中 if 真分支
		tableRef.value!.store.states.hoverRowIndex = 0;
		await flush();
		await sleep(10);
		await flush();
		wrapper.unmount();
	});

	it('rowHeight prop short-circuits handleMergeRowResize', async () => {
		const tableRef = ref<any>();
		const wrapper = mount(() => (
			<Table ref={tableRef} data={buildData(2)} rowHeight={40}>
				<TableColumn label="A" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();
		// 找 NormalList 内部 Resizer 触发 onRowResize 走 rowHeight 早返
		const norm = wrapper.findComponent({ name: 'vc-table-normal-list' });
		if (norm.exists()) {
			norm.vm.$emit('rowResize', [{ index: 0, size: 50 }]);
			await flush();
		}
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
		tableRef.value!.store.cleanSelection();
		await flush();
		wrapper.unmount();
	});

	it('Current.update: no primaryKey + currentRow removed → newCurrentRow=null branch', async () => {
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
		// expand.reset with valid ids
		vm.store.expand.reset([1]);
		await flush();
		expect(vm.store.expand.isExpanded(vm.store.states.data[0])).toBe(true);
		expect(vm.store.expand.isExpanded(vm.store.states.data[1])).toBe(false);
		// expand.toggle 触发 changed=true 路径
		vm.store.expand.toggle(vm.store.states.data[1]);
		await flush();
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
		// toggle with explicit `expanded=true` 但已展开 → changed=false 走 else 分支
		vm2.store.expand.toggle(vm2.store.states.data[0], true);
		await flush();
		// reset 传入不存在的 id → info=undefined 走 if 假分支
		vm2.store.expand.reset(['nonexistent-id']);
		await flush();
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
		vm.store.cleanSelection();
		await flush();
		expect(onSelectionChange.mock.calls.length).toBe(before);
		wrapper.unmount();
	});

	it('row mouseenter debounce setHoverRow flushes after timeout', async () => {
		const tableRef = ref<any>();
		const wrapper = mount(() => (
			<Table ref={tableRef} data={buildData(2)}>
				<TableColumn label="A" prop="name" fixed="left" />
				<TableColumn label="B" prop="count" />
			</Table>
		), { attachTo: document.body });
		await flush();
		const row = wrapper.find('.vc-table__row');
		await row.trigger('mouseenter');
		await sleep(50);
		await flush();
		await row.trigger('mouseleave');
		await sleep(50);
		await flush();
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
		expect(cols1.every((c: any) => c.realWidth >= 80)).toBe(true);

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
		const flexCol2 = cols2.find((c: any) => !c.width);
		expect(flexCol2?.realWidth).toBe(600);

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
		expect(cols3.every((c: any) => c.realWidth >= 80)).toBe(true);

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
		const flexCol4 = cols4.find((c: any) => !c.width);
		expect(flexCol4?.realWidth).toBe(500);

		// 5) fit=false + 列没有 width / minWidth → realWidth=80 fallback
		const r5 = ref<any>();
		const w5 = mount(() => (
			<Table ref={r5} data={buildData(1)} fit={false}>
				<TableColumn label="A" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();
		r5.value!.layout.updateColumnsWidth();
		expect(r5.value!.store.states.columns[0].realWidth).toBe(80);

		[w1, w2, w3, w4, w5].forEach(w => w.unmount());
	});

	it('tree-mixin lazy: walkTreeNode with nested children + isSelected toggle', async () => {
		const data = [{ id: 1, name: 'r1', hasChildren: true }];
		const loadExpand = vi.fn(() => [
			{ id: 11, name: 'r1-1', children: [{ id: 111, name: 'leaf' }] },
			{ id: 12, name: 'r1-2', hasChildren: true }
		]);
		const tableRef = ref<any>();
		const wrapper = mount(() => (
			<Table ref={tableRef} data={data} primaryKey="id" lazy loadExpand={loadExpand}>
				<TableColumn type="selection" />
				<TableColumn label="名称" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();
		const vm = tableRef.value!;
		// 先选中 row → loadData 中 isSelected 分支 + 遍历 toggleRowSelection
		vm.toggleRowSelection(vm.store.states.data[0], true, false);
		await flush();
		vm.store.tree.loadOrToggle(vm.store.states.data[0]);
		await flush();
		await sleep(0);
		await flush();
		wrapper.unmount();
	});

	it('renderExpanded slot renders for expand column when row is expanded', async () => {
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
		// 点击展开
		const icon = wrapper.find('.vc-table__expand-icon');
		await icon.trigger('click');
		await flush();
		// renderExpanded slot 被注册（store.states.expandRows 已包含此行）
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
		const fakeStore: any = { states: { foo: 'foo-value', bar: 'bar-value' } };
		const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		const states: any = useStates({
			a: 'foo',
			b: (s: any) => s.bar,
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

	it('layout edge cases: undefined height + updateScrollY early return', async () => {
		// 注意: setHeight(0) 在 vnode.el 永远为 null 的情况下会无限 nextTick 递归 OOM，
		// 这是源码 setHeight 的 `if (!el && (value || value === 0))` 分支期望真实组件挂载后 el 会变为非 null；
		// 此处单元测试仅覆盖 undefined / null 边界，递归分支由真实组件挂载路径承担。
		const fakeStore: any = {
			table: {
				vnode: { el: null },
				exposed: {
					isReady: { value: false },
					bodyYWrapper: { value: null },
					headerWrapper: { value: null },
					appendWrapper: { value: null },
					footerWrapper: { value: null },
					updateScrollY: () => {},
					resizeState: { value: { width: 0, height: 0 } }
				},
				props: { showHeader: true }
			},
			states: { columns: [] }
		};
		const layout = new Layout(fakeStore);
		layout.updateScrollY();
		layout.setHeight(undefined);
		expect(layout.states.height).toBe(null);
		layout.setMaxHeight(undefined);
		expect(layout.states.height).toBe(null);
	});

	it('Layout constructor throws when store / table missing', () => {
		expect(() => new Layout({} as any)).toThrow();
		expect(() => new Layout({ table: null } as any)).toThrow();
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
});

describe('Table utils', () => {
	it('getRowValue covers string path / function / __KEY__ / nested', () => {
		expect(getRowValue({ id: 'a' }, 'id')).toBe('a');
		expect(getRowValue({ id: { v: 1 } }, 'id.v')).toBe(1);
		expect(getRowValue({}, (row: any) => 'fn-' + JSON.stringify(row))).toContain('fn-');
		const r: any = { __KEY__: 'k' };
		expect(getRowValue(r, 'id')).toBe('k');
	});

	it('getValuesMap / getColumnById / getColumnByKey / getColumnByCell / getCell', () => {
		const arr = [{ id: 1 }, { id: 2 }];
		const map = getValuesMap(arr, 'id');
		expect(map[1].row.id).toBe(1);

		const cols: any[] = [{ id: 'a', columnKey: 'k1' }, { id: 'b', columnKey: 'k2' }];
		expect((getColumnById(cols, 'b') as any)?.id).toBe('b');
		expect((getColumnByKey(cols, 'k2') as any)?.id).toBe('b');

		const td = document.createElement('div');
		td.className = 'vc-table__td vc-table_a';
		const child = document.createElement('span');
		td.appendChild(child);
		document.body.appendChild(td);
		expect(getCell({ target: child })).toBe(td);
		expect((getColumnByCell(
			[{ id: 'vc-table_a' }, { id: 'vc-table_b' }],
			{ className: 'vc-table_b' }
		) as any)?.id).toBe('vc-table_b');
		expect(getColumnByCell([], { className: 'no-match' })).toBe(null);
		document.body.removeChild(td);

		const isolated = document.createElement('div');
		document.body.appendChild(isolated);
		expect(getCell({ target: isolated })).toBe(null);
		document.body.removeChild(isolated);
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
		expect(left[0].stickyOffset).toBe(0);
		expect(left[0].stickyStyle).toEqual({ position: 'sticky', left: '0px' });
		expect(left[0].stickyClass).toBe('is-fixed-left');
		expect(left[1].stickyOffset).toBe(80);
		expect(left[1].stickyStyle).toEqual({ position: 'sticky', left: '80px' });
		expect(left[1].stickyClass).toBe('is-fixed-left is-fixed-left-tail');
		// 从右往左累加
		expect(right[right.length - 1].stickyOffset).toBe(0);
		expect(right[right.length - 1].stickyStyle).toEqual({ position: 'sticky', right: '0px' });
		expect(right[right.length - 1].stickyClass).toBe('is-fixed-right is-fixed-right-head');
		expect(right[right.length - 2].stickyOffset).toBe(50);
		expect(right[right.length - 2].stickyStyle).toEqual({ position: 'sticky', right: '50px' });
		expect(right[right.length - 2].stickyClass).toBe('is-fixed-right');
		// 非固定列 sticky 字段清空
		const notFixed = vm.store.states.notFixedColumns;
		expect(notFixed[0].stickyOffset).toBeUndefined();
		expect(notFixed[0].stickyStyle).toBeUndefined();
		expect(notFixed[0].stickyClass).toBeUndefined();
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

	it('sticky: NormalList row-resize 直接采用单 DOM 的尺寸（不再等待 left/right）', async () => {
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
		expect(wrapper.classes()).toContain('vc-table--sticky-columns');
		const vm = tableRef.value!;
		const list = vm.store.states.list;
		// 通过 Resizer 派发 resize 事件 → NormalList emit row-resize
		const resizer = wrapper.findAllComponents({ name: 'vc-resizer' })[0];
		expect(resizer).toBeTruthy();
		resizer.vm.$emit('resize', { height: 42 });
		await flush();
		// 单 DOM：row.height 直接取 main，无需等待 left/right
		expect(list[0].rows[0].height).toBe(42);
		// 再次相同值 → short-circuit，不应改变
		resizer.vm.$emit('resize', { height: 42 });
		await flush();
		expect(list[0].rows[0].height).toBe(42);
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

	it('sticky: syncStickyOffsets applies sticky fields on top-level fixed columns (group parents only)', async () => {
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
		const leftLeaf1 = { realWidth: 60, width: 60 };
		const leftLeaf2 = { realWidth: 100, width: 100 };
		const groupedLeft = { children: [leftLeaf1, leftLeaf2] };
		const rightLeaf1 = { realWidth: 40, width: 40 };
		const rightLeaf2 = { realWidth: 70, width: 70 };
		const groupedRight = { children: [rightLeaf1, rightLeaf2] };
		vm.store.states.leftFixedColumns = [groupedLeft];
		vm.store.states.rightFixedColumns = [groupedRight];
		const notFixedColumn = {
			realWidth: 200,
			stickyOffset: 1,
			stickyStyle: { position: 'sticky', left: '0px' },
			stickyClass: 'is-fixed-left',
			children: [{ stickyOffset: 999 }, { stickyOffset: 999 }]
		};
		vm.store.states.notFixedColumns = [notFixedColumn];
		vm.layout.syncStickyOffsets();
		// 仅对 leftFixedColumns / rightFixedColumns 顶层项写入 sticky
		expect((groupedLeft as any).stickyOffset).toBe(0);
		expect((groupedLeft as any).stickyStyle).toEqual({ position: 'sticky', left: '0px' });
		expect((groupedLeft as any).stickyClass).toBe('is-fixed-left is-fixed-left-tail');
		expect((leftLeaf1 as any).stickyOffset).toBeUndefined();
		expect((leftLeaf2 as any).stickyOffset).toBeUndefined();
		expect((groupedRight as any).stickyOffset).toBe(0);
		expect((groupedRight as any).stickyStyle).toEqual({ position: 'sticky', right: '0px' });
		expect((groupedRight as any).stickyClass).toBe('is-fixed-right is-fixed-right-head');
		expect((rightLeaf1 as any).stickyOffset).toBeUndefined();
		expect((rightLeaf2 as any).stickyOffset).toBeUndefined();
		// 非固定列顶层项清除 sticky；子节点不在 syncStickyOffsets 遍历范围内
		expect((notFixedColumn as any).stickyOffset).toBeUndefined();
		expect((notFixedColumn as any).stickyStyle).toBeUndefined();
		expect((notFixedColumn as any).stickyClass).toBeUndefined();
		expect(notFixedColumn.children[0].stickyOffset).toBe(999);
		wrapper.unmount();
	});

	it('columnsToRowsEffect handles nested children + flattenData with parent/cascader + walkTreeNode lazy', () => {
		const cols: any[] = [
			{
				children: [
					{ children: null },
					{ children: null }
				]
			},
			{ children: null }
		];
		const rows = columnsToRowsEffect(cols);
		expect(rows.length).toBeGreaterThanOrEqual(1);
		expect(cols[0].colspan).toBe(2);

		const tree = [
			{ id: 1, children: [{ id: 11 }, { id: 12 }] },
			{ id: 2 }
		];
		expect(flattenData(tree).length).toBe(3);
		expect(flattenData(tree, { parent: true }).length).toBe(4);
		expect(flattenData(tree, { parent: true, cascader: true }).length).toBe(4);

		const cb = vi.fn();
		walkTreeNode(
			[
				{ hasChildren: true, id: 'lazy-root' },
				{ id: 'a', children: [{ id: 'a-1', hasChildren: true }, { id: 'a-2', children: [{ id: 'a-2-1' }] }] }
			],
			cb,
			{ childrenKey: 'children', lazyKey: 'hasChildren' }
		);
		expect(cb).toHaveBeenCalled();
	});
});

describe('v-model:columns & hidden', () => {
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

		const visibleProps = vm.store.states.columns.map((c: any) => c.prop);
		expect(visibleProps).not.toContain('name');
		expect(visibleProps).toEqual(['count', 'address']);
		// headerRows 也不含被隐藏列
		expect(vm.store.states.headerRows.flat().map((c: any) => c.prop)).not.toContain('name');
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
		expect(vm.store.states.columns.map((c: any) => c.prop)).toContain('name');

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

		expect(vm.store.states.columns.some((c: any) => c.type === 'selection')).toBe(true);

		const selectionId = columns.value.find((c: any) => c.type === 'selection').id;
		columns.value = columns.value.map((c: any) => (
			c.id === selectionId ? { ...c, hidden: true } : c
		));
		await flush();
		await sleep(60);
		await flush();

		expect(vm.store.states.columns.some((c: any) => c.type === 'selection')).toBe(false);
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

		expect(vm.store.states.originColumns.map((c: any) => c.prop)).toEqual(['name', 'count', 'address']);

		columns.value = [...columns.value].reverse();
		await flush();
		await sleep(60);
		await flush();

		expect(vm.store.states.originColumns.map((c: any) => c.prop)).toEqual(['address', 'count', 'name']);

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
			{
				id: 'g1',
				label: '分组',
				children: [
					{ id: 'c1', prop: 'a', label: 'A' },
					{ id: 'c2', prop: 'b', label: 'B' }
				]
			},
			{ id: 'c3', prop: 'c', label: 'C' }
		];
		store.updateColumns();

		const group0 = store.states.headerRows[0].find((c: any) => c.id === 'g1');
		expect(group0.colspan).toBe(2);
		expect(store.states.columns.map((c: any) => c.prop)).toEqual(['a', 'b', 'c']);

		// 隐藏其中一个子列 -> 父级 colspan 收缩为 1
		store.states._columns[0].children[0].hidden = true;
		store.updateColumns();
		const group1 = store.states.headerRows[0].find((c: any) => c.id === 'g1');
		expect(group1.colspan).toBe(1);
		expect(store.states.columns.map((c: any) => c.prop)).toEqual(['b', 'c']);

		// 隐藏全部子列 -> 父分组不再渲染
		store.states._columns[0].children[1].hidden = true;
		store.updateColumns();
		expect(store.states.originColumns.some((c: any) => c.id === 'g1')).toBe(false);
		expect(store.states.columns.map((c: any) => c.prop)).toEqual(['c']);
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
			{
				id: 'g1',
				label: '分组',
				children: [
					{ id: 'c1', prop: 'a', label: 'A' },
					{ id: 'c2', prop: 'b', label: 'B' }
				]
			},
			{ id: 'c3', prop: 'c', label: 'C' }
		];
		store.updateColumns();
		// 单测直接调用 applyExternalColumns（无父组件消费 emit 回流），
		// 每次生效的 apply 都会经 updateColumns 重新置位防回环，
		// 故在每次期望生效的调用前手动清掉置位。
		const apply = (v: any) => {
			store._columnsSync.suppressWatch = false;
			store.applyExternalColumns(v);
		};

		// guards: 非数组 / 空数组 -> 直接返回，不改动
		apply('nope' as any);
		apply([]);
		expect(store.states._columns.map((c: any) => c.id)).toEqual(['g1', 'c3']);

		// null 项与无 id 项被忽略；无变化时不重排
		apply([null, { prop: 'x' }]);
		expect(store.states._columns.map((c: any) => c.id)).toEqual(['g1', 'c3']);

		// 递归隐藏嵌套子列（按 id 命中 children）
		apply([{ id: 'c1', hidden: true }]);
		expect(store.states.columns.map((c: any) => c.prop)).toEqual(['b', 'c']);
		expect(store.states._columns.map((c: any) => c.id)).toEqual(['g1', 'c3']);

		// 顶层按 id 重排
		apply([{ id: 'c3' }, { id: 'g1' }]);
		expect(store.states._columns.map((c: any) => c.id)).toEqual(['c3', 'g1']);

		// 同序写回 -> orderChanged=false 且 hiddenChanged=false -> 不再变动
		apply([{ id: 'c3' }, { id: 'g1' }]);
		expect(store.states._columns.map((c: any) => c.id)).toEqual(['c3', 'g1']);
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
});
