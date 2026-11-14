// @vitest-environment jsdom

import { vi } from 'vitest';

// 截断判断（逐字测量）依赖真实排版，jsdom 下由用例控制返回值
const mocks = vi.hoisted(() => ({
	getFitIndex: vi.fn(() => -1)
}));

vi.mock('../../text/utils', () => mocks);

import { MPopover, MTable, MTableColumn, Table, TableColumn } from '@deot/vc-components';
import { mount, enableAutoUnmount } from '@vue/test-utils';
import { nextTick, ref } from 'vue';

enableAutoUnmount(afterEach);

const sleep = (ms = 0) => new Promise<void>(r => setTimeout(r, ms));
const flush = async () => {
	await nextTick();
	await sleep(0);
	await nextTick();
};
const defineValue = (obj: any, prop: string, value: any) => {
	Object.defineProperty(obj, prop, { configurable: true, value });
};

const data = [
	{ id: 1, name: 'name-1', status: 'a' },
	{ id: 2, name: 'name-2', status: 'b' }
];
const filterData = [{ label: 'A', value: 'a' }, { label: 'B', value: 'b' }, { label: 'C', value: 'c' }];

const findTh = (wrapper: any, label: string) => wrapper.findAll('.vc-table__th').find((item: any) => item.text().includes(label));
const findOptions = () => [...document.querySelectorAll<HTMLElement>('.vcm-select-view__option')];

describe('MTable 触屏交互', () => {
	afterEach(() => {
		mocks.getFitIndex.mockReset();
		mocks.getFitIndex.mockImplementation(() => -1);
		vi.restoreAllMocks();
		document.body.innerHTML = '';
	});

	describe('排序', () => {
		it('点可排序的表头单元格按 升序 → 降序 → 取消 循环', async () => {
			const sort = ref<any>({});
			const onSortChange = vi.fn();
			const wrapper = mount(() => (
				<MTable data={data} sort={sort.value} onUpdate:sort={(v: any) => (sort.value = v)} onSortChange={onSortChange}>
					<MTableColumn prop="name" label="名称" sortable />
					<MTableColumn prop="status" label="状态" />
				</MTable>
			), { attachTo: document.body });
			await flush();

			const th = findTh(wrapper, '名称');
			for (const order of ['ascending', 'descending', '']) {
				await th.trigger('click');
				expect(sort.value).toEqual({ prop: 'name', order });
			}
			expect(onSortChange).toHaveBeenCalledTimes(3);

			// 不可排序的列不触发
			await findTh(wrapper, '状态').trigger('click');
			expect(onSortChange).toHaveBeenCalledTimes(3);
		});

		it('Table 点表头单元格不排序', async () => {
			const onSortChange = vi.fn();
			const onHeaderClick = vi.fn();
			const wrapper = mount(() => (
				<Table data={data} onSortChange={onSortChange} onHeaderClick={onHeaderClick}>
					<TableColumn prop="name" label="名称" sortable />
				</Table>
			), { attachTo: document.body });
			await flush();

			await findTh(wrapper, '名称').trigger('click');
			expect(onHeaderClick).toHaveBeenCalledTimes(1);
			expect(onSortChange).not.toHaveBeenCalled();
		});
	});

	describe('列宽拖拽与行悬停', () => {
		it('resizable 不生效：没有拖拽线，表头右缘不出现拖拽区', async () => {
			const wrapper = mount(() => (
				<MTable data={data} resizable>
					<MTableColumn prop="name" label="名称" />
					<MTableColumn prop="status" label="状态" />
				</MTable>
			), { attachTo: document.body });
			await flush();

			const th = findTh(wrapper, '名称');
			expect(th.classes()).not.toContain('has-drag-line');
			vi.spyOn(th.element, 'getBoundingClientRect').mockReturnValue({ width: 100, right: 100 } as DOMRect);
			await th.trigger('mousemove', { clientX: 98 });
			expect(th.classes()).not.toContain('is-resize-zone');
		});

		it('点按后模拟出的 mouseover 不高亮行，单元格事件照常', async () => {
			const table = ref<any>();
			const onCellMouseenter = vi.fn();
			const wrapper = mount(() => (
				<MTable ref={table} data={data} onCellMouseenter={onCellMouseenter}>
					<MTableColumn prop="name" label="名称" />
				</MTable>
			), { attachTo: document.body });
			await flush();

			await wrapper.find('.vc-table__body-wrapper .vc-table__td').trigger('mouseover');
			await sleep(60);
			expect(onCellMouseenter).toHaveBeenCalledTimes(1);
			expect(table.value.store.states.hoverRowIndex).toBe(null);
			expect(wrapper.find('.hover-row').exists()).toBe(false);
		});
	});

	describe('筛选', () => {
		it('单选：点图标从底部弹出，第一项为「全部」，点选即生效', async () => {
			const value = ref<any>([]);
			const onHeaderClick = vi.fn();
			const onSortChange = vi.fn();
			const wrapper = mount(() => (
				<MTable data={data} onHeaderClick={onHeaderClick} onSortChange={onSortChange}>
					<MTableColumn
						prop="status"
						label="状态"
						sortable
						filterOptions={{
							'data': filterData,
							'modelValue': value.value,
							'onUpdate:modelValue': (v: any) => (value.value = v)
						}}
					/>
				</MTable>
			), { attachTo: document.body });
			await flush();

			expect(wrapper.find('.vc-dropdown').exists()).toBe(false);
			await wrapper.find('.vcm-table-filter').trigger('click');
			await flush();
			// 点筛选图标不排序，header-click 照常
			expect(onSortChange).not.toHaveBeenCalled();
			expect(onHeaderClick).toHaveBeenCalledTimes(1);

			expect(document.querySelector('.vcm-select-popup')).not.toBe(null);
			expect(document.querySelector('.vcm-select-popup')!.textContent).toContain('状态');
			expect(findOptions().map(el => el.textContent!.trim())).toEqual(['全部', 'A', 'B', 'C']);

			findOptions()[2].click();
			await flush();
			expect(value.value).toEqual(['b']);
			expect(wrapper.find('.vc-table-filter__icon').classes()).toContain('is-active');

			// 再次打开，选「全部」清空
			await wrapper.find('.vcm-table-filter').trigger('click');
			await flush();
			findOptions().filter(el => el.isConnected && el.closest('.vcm-select-popup'))
				.reverse().find(el => el.textContent!.trim() === '全部')!.click();
			await flush();
			expect(value.value).toEqual([]);
			expect(wrapper.find('.vc-table-filter__icon').classes()).not.toContain('is-active');
		});

		it('多选：勾选后点「确定」生效', async () => {
			const onChange = vi.fn();
			const wrapper = mount(() => (
				<MTable data={data}>
					<MTableColumn prop="status" label="状态" filterOptions={{ data: filterData, max: 2, onChange }} />
				</MTable>
			), { attachTo: document.body });
			await flush();

			await wrapper.find('.vcm-table-filter').trigger('click');
			await flush();
			expect(findOptions().map(el => el.textContent!.trim())).toEqual(['A', 'B', 'C']);
			findOptions()[0].click();
			findOptions()[2].click();
			await flush();
			expect(onChange).not.toHaveBeenCalled();

			const buttons = [...document.querySelectorAll<HTMLElement>('.vcm-select-popup .vc-button')];
			buttons[buttons.length - 1].click();
			await sleep(300);
			expect(onChange).toHaveBeenCalledWith(['a', 'c']);
		});
	});

	describe('省略提示', () => {
		const mountTable = async () => {
			const wrapper = mount(() => (
				<MTable data={data}>
					<MTableColumn prop="name" label="名称" line={1} />
				</MTable>
			), { attachTo: document.body });
			await flush();
			const tds = wrapper.findAll('.vc-table__body-wrapper .vc-table__td');
			tds.forEach((td) => {
				const textLine = td.element.querySelector('.vc-table__text-line')!;
				defineValue(textLine, 'scrollHeight', 40);
				defineValue(textLine, 'clientHeight', 20);
			});
			mocks.getFitIndex.mockImplementation(() => 3);
			return { wrapper, tds };
		};

		it('点被截断的单元格弹出完整内容（移动端外观、非悬停），移入不弹出', async () => {
			const open = vi.spyOn(MPopover, 'open').mockImplementation(() => ({ destroy: vi.fn() }) as any);
			const { tds } = await mountTable();

			await tds[0].trigger('mouseover');
			expect(open).not.toHaveBeenCalled();

			await tds[0].trigger('click');
			expect(open).toHaveBeenCalledWith(expect.objectContaining({
				content: 'name-1',
				hover: false,
				triggerElement: tds[0].element
			}));
		});

		it('未截断不弹出', async () => {
			const open = vi.spyOn(MPopover, 'open').mockImplementation(() => ({ destroy: vi.fn() }) as any);
			const { tds } = await mountTable();
			mocks.getFitIndex.mockImplementation(() => -1);

			await tds[0].trigger('click');
			expect(open).not.toHaveBeenCalled();
		});

		it('再点同一处不重新打开，点另一处换成新的', async () => {
			const open = vi.spyOn(MPopover, 'open').mockImplementation(() => ({ destroy: vi.fn() }) as any);
			const { tds } = await mountTable();

			await tds[0].trigger('click');
			expect(open).toHaveBeenCalledTimes(1);
			// 弹层已被这次点按关掉（模拟的弹层没有 wrapper，视为未显示）
			await tds[0].trigger('click');
			expect(open).toHaveBeenCalledTimes(1);
			await tds[1].trigger('click');
			expect(open).toHaveBeenCalledTimes(2);
			expect(open).toHaveBeenLastCalledWith(expect.objectContaining({ content: 'name-2' }));
		});
	});

	describe('表头说明', () => {
		it('点图标弹出（非悬停）且不排序，再点同一个图标不重新打开', async () => {
			const leaf = { destroy: vi.fn(), wrapper: { isActive: true } };
			const open = vi.spyOn(MPopover, 'open').mockImplementation(() => leaf as any);
			const sort = ref<any>({});
			const wrapper = mount(() => (
				<MTable data={data} sort={sort.value} onUpdate:sort={(v: any) => (sort.value = v)}>
					<MTableColumn prop="name" label="名称" sortable tooltip="说明" />
				</MTable>
			), { attachTo: document.body });
			await flush();

			const icon = wrapper.find('.vc-table__tooltip');
			await icon.trigger('mouseenter');
			expect(open).not.toHaveBeenCalled();

			await icon.trigger('click');
			expect(open).toHaveBeenCalledTimes(1);
			expect(open).toHaveBeenLastCalledWith(expect.objectContaining({ content: '说明', hover: false }));
			expect(sort.value).toEqual({});

			// 弹层已被这次点按关掉（按外部点击处理）：不重新打开
			leaf.wrapper.isActive = false;
			await icon.trigger('click');
			expect(open).toHaveBeenCalledTimes(1);
			// 再点一次重新打开
			await icon.trigger('click');
			expect(open).toHaveBeenCalledTimes(2);
		});
	});
});
