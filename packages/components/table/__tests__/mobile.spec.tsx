// @vitest-environment jsdom

import { MSpin, MTable, MTableColumn, Table, TableColumn } from '@deot/vc-components';
import { mount, enableAutoUnmount } from '@vue/test-utils';
import { nextTick, ref } from 'vue';
import { vi } from 'vitest';
import { treeCellPrefix } from '../table-column/table-column-config';

enableAutoUnmount(afterEach);

const sleep = (time = 0) => new Promise(resolve => setTimeout(resolve, time));
// 布局更新带 50ms 的防抖
const flushLayout = async () => {
	await nextTick();
	await sleep(80);
	await nextTick();
};
const buildData = (length: number) => Array.from({ length }).map((_, index) => ({
	id: `id__${index}`,
	name: `name-${index}`
}));

// 记录所有 ResizeObserver 实例：按被观察的元素找到对应的观察器再触发回调
const observers: any[] = [];
const MockResizeObserver = (globalThis as any).ResizeObserver;
(globalThis as any).ResizeObserver = class extends MockResizeObserver {
	constructor(cb: any) {
		super(cb);
		observers.push(this);
	}
};

// useRem 的探针：jsdom 不做布局，宽度（750 个单位的 px）由这里给出
const getProbe = () => [...document.body.children].find(el => (el as HTMLElement).style.width.includes('--vc-rem')) as HTMLElement;
let probeWidth = 375;
const setProbeWidth = (width: number) => {
	probeWidth = width;
	const probe = getProbe();
	observers.forEach(observer => observer.targets.has(probe) && observer.trigger(probe));
};

const getWidths = (table: any) => table.store.states.columns.map((column: any) => column.states.realWidth);

describe('MTable', () => {
	let rect: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		probeWidth = 375;
		const origin = HTMLElement.prototype.getBoundingClientRect;
		rect = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
			return this.style.width.includes('--vc-rem') ? { width: probeWidth } as DOMRect : origin.call(this);
		});
	});

	afterEach(() => {
		rect.mockRestore();
	});

	describe('结构', () => {
		it('根节点为桌面端结构加标记类 vcm-table，内部组件为移动端的版本', async () => {
			const wrapper = mount(() => (
				<MTable data={buildData(2)} primaryKey="id">
					<MTableColumn type="selection" />
					<MTableColumn prop="name" label="name" />
				</MTable>
			));
			await flushLayout();
			expect(wrapper.classes()).toEqual(expect.arrayContaining(['vc-table', 'vcm-table']));
			expect(wrapper.find('.vc-table__body-wrapper').classes()).toContain('vcm-scroller');
			expect(wrapper.findAll('.vcm-checkbox').length).toBe(3);
			expect(wrapper.find('.vc-checkbox').exists()).toBe(false);
		});

		it('固定高度的表体为 MRecycleList', async () => {
			const wrapper = mount(() => (
				<MTable data={buildData(2)} height={400}>
					<MTableColumn prop="name" label="name" />
				</MTable>
			));
			await flushLayout();
			expect(wrapper.find('.vc-recycle-list').classes()).toContain('vcm-recycle-list');
			expect(wrapper.find('.vc-recycle-list__wrapper').classes()).toContain('vcm-scroller');
		});

		it('Table 不带标记类，内部组件为桌面端的版本', async () => {
			const wrapper = mount(() => (
				<Table data={buildData(2)} primaryKey="id">
					<TableColumn type="selection" />
					<TableColumn prop="name" label="name" />
				</Table>
			));
			await flushLayout();
			expect(wrapper.classes()).not.toContain('vcm-table');
			expect(wrapper.find('.vc-table__body-wrapper').classes()).not.toContain('vcm-scroller');
			expect(wrapper.find('.vcm-checkbox').exists()).toBe(false);
		});
	});

	describe('750 稿长度', () => {
		it('列的数字 width / minWidth 按 --vc-rem 的 px 换算，字符串不换算', async () => {
			const table = ref<any>();
			mount(() => (
				<MTable ref={table} data={buildData(1)}>
					<MTableColumn type="selection" />
					<MTableColumn prop="name" label="a" width={200} />
					<MTableColumn prop="name" label="b" minWidth={300} />
					<MTableColumn prop="name" label="c" width="120px" />
					<MTableColumn prop="name" label="d" />
				</MTable>
			));
			await flushLayout();
			expect(table.value.store.states.unit).toBe(0.5);
			// 特殊列预设 96、缺省的最小列宽 160
			expect(getWidths(table.value)).toEqual([48, 100, 150, 120, 80]);
		});

		it('换算后取整', async () => {
			const table = ref<any>();
			mount(() => (
				<MTable ref={table} data={buildData(1)}>
					<MTableColumn prop="name" label="a" width={175} />
				</MTable>
			));
			await flushLayout();
			expect(getWidths(table.value)).toEqual([88]);
		});

		it('数字 height / maxHeight 换算成 px 写到根节点', async () => {
			const height = mount(() => (
				<MTable data={buildData(1)} height={400}>
					<MTableColumn prop="name" label="a" />
				</MTable>
			));
			const maxHeight = mount(() => (
				<MTable data={buildData(1)} maxHeight="300px">
					<MTableColumn prop="name" label="a" />
				</MTable>
			));
			await flushLayout();
			expect(height.element.style.height).toBe('200px');
			expect(maxHeight.element.style.maxHeight).toBe('300px');
		});

		it('数字 rowHeight 换算成 px 作为行高，交给虚拟列表的预估尺寸保持 750 稿', async () => {
			const wrapper = mount(() => (
				<MTable data={buildData(2)} height={400} rowHeight={88}>
					<MTableColumn prop="name" label="a" />
				</MTable>
			));
			await flushLayout();
			const list = wrapper.findComponent({ name: 'vcm-recycle-list' });
			expect(list.props('estimateSize')({ row: { rows: [1] } })).toBe(88);
			expect((list.vm as any).store.states.rebuildData.map((node: any) => node.estimate)).toEqual([44, 44]);
			const grid = wrapper.find('.vc-table__body-wrapper .vc-table__grid').element as HTMLElement;
			expect(grid.style.gridAutoRows).toBe('44px');
		});

		it('--vc-rem 变化后列宽与高度重新换算', async () => {
			const table = ref<any>();
			const wrapper = mount(() => (
				<MTable ref={table} data={buildData(1)} height={400}>
					<MTableColumn type="selection" />
					<MTableColumn prop="name" label="a" width={200} />
					<MTableColumn prop="name" label="b" />
				</MTable>
			));
			await flushLayout();
			expect(getWidths(table.value)).toEqual([48, 100, 80]);

			setProbeWidth(480);
			await flushLayout();
			expect(table.value.store.states.unit).toBe(0.64);
			expect(getWidths(table.value)).toEqual([61, 128, 102]);
			expect(wrapper.element.style.height).toBe('256px');
		});

		it('Table 的单位为 px，不随 --vc-rem 变化', async () => {
			const table = ref<any>();
			const wrapper = mount(() => (
				<Table ref={table} data={buildData(1)} height={400}>
					<TableColumn type="selection" />
					<TableColumn prop="name" label="a" width={200} />
					<TableColumn prop="name" label="b" />
				</Table>
			));
			await flushLayout();
			expect(table.value.store.states.unit).toBe(1);
			expect(getWidths(table.value)).toEqual([60, 200, 80]);
			expect(wrapper.element.style.height).toBe('400px');
		});

		it('indent 默认 32（750 稿），Table 仍为 16px', () => {
			expect((MTable as any).props.indent.default).toBe(32);
			expect((Table as any).props.indent.default).toBe(16);
		});

		it('树形缩进随 --vc-rem 缩放，加载图标为 750 稿尺寸', () => {
			const store = {
				tree: { toggle: vi.fn() },
				table: { exposed: { mobile: true, components: { Spin: MSpin } } }
			};
			const treeNode = { level: 1, indent: 32, expandable: true, expanded: false, loading: true };
			const [indent, icon]: any = treeCellPrefix({ row: {}, treeNode, store } as any);
			expect(indent.props.style).toEqual({ paddingLeft: 'calc(var(--vc-rem) * 32)' });
			expect(icon.children[0].type.name).toBe('vcm-spin');
			expect(icon.children[0].props.size).toBe(24);
		});
	});
});
