// @vitest-environment jsdom

import { vi } from 'vitest';

// 截断判断（逐字测量）依赖真实排版，jsdom 下由用例控制返回值
const mocks = vi.hoisted(() => ({
	getFitIndex: vi.fn(() => -1)
}));

vi.mock('../../text/utils', () => mocks);

import { Table, TableColumn, Popover } from '@deot/vc-components';
import { mount } from '@vue/test-utils';
import { nextTick, ref } from 'vue';
import { VcInstance } from '../../vc';
import { getTooltipWidth } from '../hooks/use-text-line-tooltip';

const sleep = (ms = 0) => new Promise<void>(r => setTimeout(r, ms));

const flush = async () => {
	await nextTick();
	await sleep(0);
	await nextTick();
};

const defineValue = (obj: any, prop: string, value: any) => {
	Object.defineProperty(obj, prop, { configurable: true, value });
};

const data = [{ id: 1, name: 'name-1', info: { name: 'nested-value' } }];

const textLineOf = (wrapper: any, label: string) => {
	const th = wrapper.findAll('.vc-table__th').find((item: any) => item.text().includes(label));
	return th.find('.vc-table__th-label > .vc-table__text-line');
};

describe('header-line', () => {
	const original = { ...VcInstance.options.TableColumn };

	afterEach(() => {
		VcInstance.options.TableColumn = { ...original };
		mocks.getFitIndex.mockReset();
		mocks.getFitIndex.mockImplementation(() => -1);
		vi.restoreAllMocks();
		document.body.innerHTML = '';
	});

	it('列与全局都未设置时为 1；header-line 为 0 时不限行数', async () => {
		const wrapper = mount(() => (
			<Table data={data} primaryKey="id">
				<TableColumn label="默认" prop="name" />
				<TableColumn label="两行" prop="name" headerLine={2} />
				<TableColumn label="不限" prop="name" headerLine={0} />
			</Table>
		), { attachTo: document.body });
		await flush();

		expect((textLineOf(wrapper, '默认').element as HTMLElement).style.webkitLineClamp).toBe('1');
		expect((textLineOf(wrapper, '两行').element as HTMLElement).style.webkitLineClamp).toBe('2');
		expect((textLineOf(wrapper, '不限').element as HTMLElement).style.webkitLineClamp).toBe('none');
		wrapper.unmount();
	});

	it('全局配置生效，列上的 header-line 优先于全局', async () => {
		VcInstance.options.TableColumn.headerLine = 2;
		const wrapper = mount(() => (
			<Table data={data} primaryKey="id">
				<TableColumn label="全局" prop="name" />
				<TableColumn label="列上" prop="name" headerLine={1} />
			</Table>
		), { attachTo: document.body });
		await flush();

		expect((textLineOf(wrapper, '全局').element as HTMLElement).style.webkitLineClamp).toBe('2');
		expect((textLineOf(wrapper, '列上').element as HTMLElement).style.webkitLineClamp).toBe('1');

		// 全局配置为响应式：运行时修改同步到表头
		VcInstance.options.TableColumn.headerLine = 3;
		await flush();
		expect((textLineOf(wrapper, '全局').element as HTMLElement).style.webkitLineClamp).toBe('3');
		wrapper.unmount();
	});

	it('自定义表头（header 插槽 / render-header）不走 header-line，仍包在 th-label 内', async () => {
		const wrapper = mount(() => (
			<Table data={data} primaryKey="id">
				<TableColumn prop="name" headerLine={2}>
					{{ header: () => <span class="custom-slot">插槽</span> }}
				</TableColumn>
				<TableColumn
					prop="name"
					headerLine={2}
					renderHeader={() => <span class="custom-render">render</span>}
				/>
			</Table>
		), { attachTo: document.body });
		await flush();

		const slot = wrapper.find('.vc-table__th-label > .custom-slot');
		const render = wrapper.find('.vc-table__th-label > .custom-render');
		expect(slot.exists()).toBe(true);
		expect(render.exists()).toBe(true);
		expect(wrapper.find('.vc-table__th .vc-table__text-line').exists()).toBe(false);
		wrapper.unmount();
	});

	it('表头 label 截断时 hover 展示完整内容，未截断时不做逐字测量', async () => {
		const open = vi.spyOn(Popover, 'open').mockImplementation(() => ({ destroy: vi.fn() }) as any);
		const wrapper = mount(() => (
			<Table data={data} primaryKey="id">
				<TableColumn label="很长的表头" prop="name" headerLine={2} sortable />
			</Table>
		), { attachTo: document.body });
		await flush();

		const label = wrapper.find('.vc-table__th-label');
		const textLine = label.find('.vc-table__text-line').element;

		// 未截断
		defineValue(textLine, 'scrollHeight', 40);
		defineValue(textLine, 'clientHeight', 40);
		await label.trigger('mouseenter');
		expect(mocks.getFitIndex).not.toHaveBeenCalled();
		expect(open).not.toHaveBeenCalled();

		// 截断
		defineValue(textLine, 'scrollHeight', 60);
		mocks.getFitIndex.mockImplementation(() => 2);
		await label.trigger('mouseenter');
		expect(mocks.getFitIndex).toHaveBeenCalledWith(expect.objectContaining({
			el: textLine,
			value: '很长的表头',
			line: 2,
			ellipsis: '...'
		}));
		// 弹层锚在 label 上（鼠标移入的节点）
		expect(open).toHaveBeenCalledWith(expect.objectContaining({ triggerEl: label.element, content: '很长的表头' }));
		// jsdom 中测量不到文字宽度：不限制宽度，只受 Popover 的屏幕上限约束（宽度的计算见 getTooltipWidth 用例）
		expect(open.mock.calls[0][0]).not.toHaveProperty('portalStyle');

		// 从排序图标移入 th 不触发（弹层只随 text-line 的移入移出开关）
		open.mockClear();
		await wrapper.find('.vc-table__th').trigger('mouseenter');
		expect(open).not.toHaveBeenCalled();
		wrapper.unmount();
	});

	it('表体 text-line 截断：按渲染的文本取值（支持嵌套 prop）', async () => {
		const open = vi.spyOn(Popover, 'open').mockImplementation(() => ({ destroy: vi.fn() }) as any);
		const wrapper = mount(() => (
			<Table data={data} primaryKey="id">
				<TableColumn label="嵌套" prop="info.name" line={1} />
			</Table>
		), { attachTo: document.body });
		await flush();

		const textLine = wrapper.find('.vc-table__td .vc-table__text-line').element;
		defineValue(textLine, 'scrollHeight', 40);
		defineValue(textLine, 'clientHeight', 20);
		mocks.getFitIndex.mockImplementation(() => 3);
		await wrapper.find('.vc-table__td').trigger('mouseover');

		expect(mocks.getFitIndex).toHaveBeenCalledWith(expect.objectContaining({
			value: 'nested-value',
			line: 1,
			ellipsis: '...'
		}));
		// 弹层锚在单元格上：text-line 外还有 padding，锚在 text-line 上会盖住鼠标所在的格子
		expect(open).toHaveBeenCalledWith(expect.objectContaining({
			content: 'nested-value',
			triggerEl: wrapper.find('.vc-table__td').element
		}));
		wrapper.unmount();
	});

	it('滚动期间不弹出，滚动停止后鼠标仍在单元格上时再弹出', async () => {
		const open = vi.spyOn(Popover, 'open').mockImplementation(() => ({ destroy: vi.fn() }) as any);
		const wrapper = mount(() => (
			<Table data={data} primaryKey="id">
				<TableColumn label="嵌套" prop="info.name" line={1} />
			</Table>
		), { attachTo: document.body });
		await flush();

		const td = wrapper.find('.vc-table__td').element;
		const textLine = td.querySelector('.vc-table__text-line')!;
		defineValue(textLine, 'scrollHeight', 40);
		defineValue(textLine, 'clientHeight', 20);
		mocks.getFitIndex.mockImplementation(() => 3);

		// 表体滚动（捕获阶段监听）后，内容在静止的鼠标下移动触发移入
		td.dispatchEvent(new Event('scroll'));
		await wrapper.find('.vc-table__td').trigger('mouseover');
		expect(open).not.toHaveBeenCalled();

		defineValue(td, 'matches', (selector: string) => selector === ':hover');
		await sleep(200);
		expect(open).toHaveBeenCalledWith(expect.objectContaining({ triggerEl: td }));
		wrapper.unmount();
	});

	it('height：表头高度变化时重算表体高度（表格根节点尺寸不变）', async () => {
		const tableRef = ref<any>();
		const wrapper = mount(() => (
			<Table ref={tableRef} data={data} primaryKey="id" height={300}>
				<TableColumn label="名称" prop="name" headerLine={3} />
			</Table>
		), { attachTo: document.body });
		await flush();
		await sleep(20);
		await flush();

		const vm = tableRef.value!;
		const headerEl = wrapper.find('.vc-table__header-wrapper').element as HTMLElement;
		const rz = (headerEl as any).__rz__;
		expect(rz?.listeners?.length).toBeGreaterThan(0);

		defineValue(wrapper.element, 'clientHeight', 300);
		const updateElsHeight = vi.spyOn(vm.layout, 'updateElsHeight');

		// 高度不变：不处理
		rz.listeners.forEach((fn: any) => fn());
		expect(updateElsHeight).not.toHaveBeenCalled();

		defineValue(headerEl, 'offsetHeight', 81);
		rz.listeners.forEach((fn: any) => fn());
		await flush();
		expect(updateElsHeight).toHaveBeenCalledTimes(1);
		expect(vm.layout.states.headerHeight).toBe(81);
		expect(vm.layout.states.bodyHeight).toBe(300 - 81);

		defineValue(headerEl, 'offsetHeight', 41);
		rz.listeners.forEach((fn: any) => fn());
		await flush();
		expect(vm.layout.states.bodyHeight).toBe(300 - 41);

		// 卸载后解绑
		wrapper.unmount();
		expect(rz.listeners.length).toBe(0);
	});

	it('max-height：表头高度变化时同步表体的 max-height', async () => {
		const tableRef = ref<any>();
		const wrapper = mount(() => (
			<Table ref={tableRef} data={data} primaryKey="id" maxHeight={300}>
				<TableColumn label="名称" prop="name" headerLine={2} />
			</Table>
		), { attachTo: document.body });
		await flush();
		await sleep(20);
		await flush();

		const headerEl = wrapper.find('.vc-table__header-wrapper').element as HTMLElement;
		defineValue(headerEl, 'offsetHeight', 61);
		(headerEl as any).__rz__.listeners.forEach((fn: any) => fn());
		await flush();

		const bodyEl = wrapper.find('.vc-table__body-wrapper').element as HTMLElement;
		expect(tableRef.value!.layout.states.headerHeight).toBe(61);
		expect(bodyEl.style.maxHeight).toBe(`${300 - 61}px`);
		wrapper.unmount();
	});

	it('流式高度：表头高度变化只刷新吸附，不测量表体高度', async () => {
		const tableRef = ref<any>();
		const wrapper = mount(() => (
			<Table ref={tableRef} data={data} primaryKey="id">
				<TableColumn label="名称" prop="name" headerLine={2} />
			</Table>
		), { attachTo: document.body });
		await flush();
		await sleep(20);
		await flush();

		const vm = tableRef.value!;
		const updateElsHeight = vi.spyOn(vm.layout, 'updateElsHeight');
		const headerEl = wrapper.find('.vc-table__header-wrapper').element as HTMLElement;
		defineValue(headerEl, 'offsetHeight', 61);
		(headerEl as any).__rz__.listeners.forEach((fn: any) => fn());
		await flush();
		expect(updateElsHeight).not.toHaveBeenCalled();
		wrapper.unmount();
	});

	it('showHeader 切换时按新的表头节点重新绑定', async () => {
		const showHeader = ref(true);
		const wrapper = mount(() => (
			<Table data={data} primaryKey="id" showHeader={showHeader.value}>
				<TableColumn label="名称" prop="name" />
			</Table>
		), { attachTo: document.body });
		await flush();

		const oldHeader = wrapper.find('.vc-table__header-wrapper').element as any;
		expect(oldHeader.__rz__.listeners.length).toBe(1);

		showHeader.value = false;
		await flush();
		expect(oldHeader.__rz__.listeners.length).toBe(0);

		showHeader.value = true;
		await flush();
		const newHeader = wrapper.find('.vc-table__header-wrapper').element as any;
		expect(newHeader).not.toBe(oldHeader);
		expect(newHeader.__rz__.listeners.length).toBe(1);
		wrapper.unmount();
	});
});

describe('getTooltipWidth：长文字按宽高比 3:1，短文字不换行', () => {
	// 弹层默认字体 13px / 行高 20px，内容区左右 padding 共 24px；一行至少 20 个字（260px）
	const size = (width: number) => ({ width, fontSize: 13, lineHeight: 20, padding: 24 });

	it('长文字：宽度为 √(3 × 单行宽 × 行高)', () => {
		// 单行 7200px：√(3 × 7200 × 20) ≈ 657.3，约 11 行、高 220px
		expect(getTooltipWidth(size(7200), 140)).toBe(682);
		// 单行 1200px：√(3 × 1200 × 20) ≈ 268.3，约 5 行
		expect(getTooltipWidth(size(1200), 140)).toBe(293);
	});

	it('短文字不换行：一行放得下 20 个字以内的文字（如表头）', () => {
		// “供应商信息”约 65px，单元格文字宽 56px
		expect(getTooltipWidth(size(65), 56)).toBe(89);
		expect(getTooltipWidth(size(200), 56)).toBe(224);
	});

	it('比 20 个字长时，一行至少 20 个字', () => {
		// √(3 × 300 × 20) ≈ 134.2 < 260
		expect(getTooltipWidth(size(300), 140)).toBe(284);
	});

	it('单元格文字比 20 个字还宽时，不窄于单元格', () => {
		expect(getTooltipWidth(size(600), 400)).toBe(424);
	});

	it('测量不到时返回 0（不限制宽度）', () => {
		expect(getTooltipWidth(size(0), 140)).toBe(0);
		expect(getTooltipWidth({ ...size(1200), lineHeight: 0 }, 140)).toBe(0);
	});
});
