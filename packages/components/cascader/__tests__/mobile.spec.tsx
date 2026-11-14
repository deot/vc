// @vitest-environment jsdom

import { MCascader, MCascaderView } from '@deot/vc-components';
import { mount } from '@vue/test-utils';
import { nextTick, ref } from 'vue';
import { vi } from 'vitest';
import { toCascaderPath, toCascaderValue } from '../utils';

const sleep = (ms = 0) => new Promise<void>(r => setTimeout(r, ms));
const flush = async () => {
	await nextTick();
	await sleep(0);
	await nextTick();
};

const createData = () => [
	{
		value: 1,
		label: '分组 A',
		children: [
			{ value: 11, label: '条目 A-1', children: [{ value: 111, label: '细项 A-1-1' }, { value: 112, label: '细项 A-1-2' }] },
			{ value: 12, label: '条目 A-2' }
		]
	},
	{ value: 2, label: '分组 B', children: [{ value: 21, label: '条目 B-1' }] },
	{ value: 3, label: '分组 C', disabled: true }
];

const getTabs = (root: ParentNode = document) => Array.from(root.querySelectorAll('.vcm-tabs__item')).map(i => i.textContent);
const getActivePane = (root: ParentNode = document) => {
	return Array.from(root.querySelectorAll<HTMLElement>('.vcm-tabs-pane')).find(el => el.style.height !== '0px')!;
};
const getOptions = (root: ParentNode = document) => {
	return Array.from(getActivePane(root).querySelectorAll<HTMLElement>('.vcm-cascader-view__option'));
};
const clickOption = async (label: string, root: ParentNode = document) => {
	const el = getOptions(root).find(i => i.textContent === label);
	expect(el, label).toBeTruthy();
	el!.click();
	await flush();
	// MTabs 连续点击的间隔限制只针对标签，这里等动画与注册完成
	await sleep(10);
	await flush();
};

describe('cascader/mobile utils', () => {
	it('toCascaderPath / toCascaderValue 与桌面端一致', () => {
		const data = createData();
		const base = { numerable: false, separator: ',', data };
		expect(toCascaderPath([1, 11], { ...base, checkStrategy: 'all' })).toEqual([1, 11]);
		// 值在不同分支重复时保留当前路径
		expect(toCascaderPath(111, { ...base, checkStrategy: 'child' }, [9, 111])).toEqual([9, 111]);
		expect(toCascaderPath('1,11', { ...base, numerable: true, checkStrategy: 'all' })).toEqual([1, 11]);
		expect(toCascaderPath(111, { ...base, checkStrategy: 'child' })).toEqual([1, 11, 111]);
		expect(toCascaderPath([111], { ...base, checkStrategy: 'child' })).toEqual([1, 11, 111]);
		expect(toCascaderPath('', { ...base, checkStrategy: 'child' })).toEqual([]);

		const options = { modelValue: [], numerable: false, separator: ',', nullValue: null };
		expect(toCascaderValue([1, 11], { ...options, checkStrategy: 'all' })).toEqual([1, 11]);
		// 非数组：整条路径按 separator 连接；清空为 nullValue，没有设置时字符串值为 ''
		expect(toCascaderValue([1, 11], { ...options, modelValue: '', separator: ';', checkStrategy: 'all' })).toBe('1;11');
		expect(toCascaderValue([], { ...options, modelValue: '1;11', checkStrategy: 'all' })).toBe(null);
		expect(toCascaderValue([], { ...options, modelValue: '1;11', nullValue: void 0, checkStrategy: 'all' })).toBe('');
		expect(toCascaderValue([1, 11], { ...options, checkStrategy: 'child' })).toEqual([11]);
		expect(toCascaderValue([1, 11], { ...options, modelValue: 0, checkStrategy: 'child' })).toBe(11);
		expect(toCascaderValue([], { ...options, modelValue: 0, checkStrategy: 'child' })).toBe(null);
	});
});

describe('MCascaderView', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('逐级选择：待选一级显示 placeholder，只在最后一级提交，每次点选触发 select', async () => {
		const value = ref<any[]>([]);
		const onChange = vi.fn();
		const onSelect = vi.fn();
		const wrapper = mount(() => (
			<MCascaderView
				v-model={value.value}
				data={createData()}
				onChange={onChange}
				onSelect={onSelect}
			/>
		), { attachTo: document.body });
		await flush();

		expect(getTabs()).toEqual(['请选择']);
		expect(document.querySelector('.vcm-cascader-view__placeholder')).toBeTruthy();

		await clickOption('分组 A');
		expect(getTabs()).toEqual(['分组 A', '请选择']);
		expect(onChange).not.toHaveBeenCalled();
		expect(onSelect).toHaveBeenLastCalledWith(expect.objectContaining({ values: [1], labels: ['分组 A'], leaf: false }));

		await clickOption('条目 A-1');
		await clickOption('细项 A-1-2');
		expect(getTabs()).toEqual(['分组 A', '条目 A-1', '细项 A-1-2']);
		expect(value.value).toEqual([1, 11, 112]);
		expect(onChange).toHaveBeenCalledWith([1, 11, 112], ['分组 A', '条目 A-1', '细项 A-1-2']);
		expect(onSelect).toHaveBeenLastCalledWith(expect.objectContaining({ values: [1, 11, 112], leaf: true }));
		expect(getActivePane().querySelector('.is-selected .vcm-cascader-view__icon')).toBeTruthy();

		// 回到第一级换分支：后面的级被截断
		(document.querySelectorAll<HTMLElement>('.vcm-tabs__item')[0]).click();
		await flush();
		await clickOption('分组 B');
		expect(getTabs()).toEqual(['分组 B', '请选择']);
		expect(value.value).toEqual([1, 11, 112]);

		wrapper.unmount();
	});

	it('changeOnSelect 任意一级提交；禁用项点不动', async () => {
		const value = ref<any>([]);
		const wrapper = mount(() => (
			<MCascaderView v-model={value.value} data={createData()} changeOnSelect />
		), { attachTo: document.body });
		await flush();

		await clickOption('分组 C');
		expect(value.value).toEqual([]);
		expect(getOptions().find(i => i.textContent === '分组 C')!.classList).toContain('is-disabled');

		await clickOption('分组 A');
		expect(value.value).toEqual([1]);
		wrapper.unmount();
	});

	it('回显：checkStrategy child 与字符串路径 numerable', async () => {
		const wrapper = mount(() => (
			<div>
				<div class="a"><MCascaderView modelValue={111} data={createData()} checkStrategy="child" /></div>
				<div class="b"><MCascaderView modelValue="1,12" data={createData()} numerable /></div>
			</div>
		), { attachTo: document.body });
		await flush();
		const a = document.querySelector('.a')!;
		const b = document.querySelector('.b')!;
		expect(getTabs(a)).toEqual(['分组 A', '条目 A-1', '细项 A-1-1']);
		expect(getActivePane(a).querySelector('.is-selected')!.textContent).toBe('细项 A-1-1');
		expect(getTabs(b)).toEqual(['分组 A', '条目 A-2']);
		wrapper.unmount();
	});

	it('loadData 收到 { row, values, labels }，加载中显示 Spin', async () => {
		let resolve: (v: any[]) => void;
		const data = [{ value: 'a', label: '分组 A', children: [] as any[] }];
		const loadData = vi.fn(() => new Promise<any[]>((r) => {
			resolve = r;
		}));
		const value = ref<any[]>([]);
		const wrapper = mount(() => (
			<MCascaderView v-model={value.value} data={data} loadData={loadData} />
		), { attachTo: document.body });
		await flush();

		getOptions()[0].click();
		await flush();
		expect(loadData).toHaveBeenCalledWith({ row: data[0], values: ['a'], labels: ['分组 A'] });
		expect(document.querySelector('.vcm-cascader-view__loading')).toBeTruthy();

		resolve!([{ value: 'a-1', label: '条目 A-1' }]);
		await flush();
		await sleep(10);
		await flush();
		expect(document.querySelector('.vcm-cascader-view__loading')).toBeNull();
		expect(getTabs()).toEqual(['分组 A', '请选择']);
		await clickOption('条目 A-1');
		expect(value.value).toEqual(['a', 'a-1']);
		wrapper.unmount();
	});

	it('搜索：按路径匹配并高亮，选中结果写入整条路径，无结果时提示', async () => {
		const value = ref<any[]>([]);
		const wrapper = mount(() => (
			<MCascaderView v-model={value.value} data={createData()} searchable />
		), { attachTo: document.body });
		await flush();

		const input = document.querySelector('.vcm-cascader-view__search input') as HTMLInputElement;
		input.value = 'A 1-2';
		input.dispatchEvent(new Event('input'));
		await flush();

		const results = Array.from(document.querySelectorAll<HTMLElement>('.vcm-cascader-view__options.is-results .vcm-cascader-view__option'));
		expect(results.map(i => i.textContent)).toEqual(['分组 A / 条目 A-1 / 细项 A-1-2']);
		expect(results[0].querySelector('.vc-select-highlight')).toBeTruthy();

		results[0].click();
		await flush();
		expect(value.value).toEqual([1, 11, 112]);
		expect(document.querySelector('.is-results')).toBeNull();

		input.value = '不存在';
		input.dispatchEvent(new Event('input'));
		await flush();
		expect(document.querySelector('.vcm-cascader-view__empty')!.textContent).toBe('暂无匹配数据');
		wrapper.unmount();
	});

	it('clearable：有选中路径时标签栏右端显示清空，先 clear 再提交空值', async () => {
		const value = ref<any>([1, 12]);
		const calls: string[] = [];
		const wrapper = mount(() => (
			<MCascaderView
				v-model={value.value}
				data={createData()}
				clearable
				onClear={() => calls.push('clear')}
				onChange={() => calls.push('change')}
			/>
		), { attachTo: document.body });
		await flush();
		const clear = () => document.querySelector<HTMLElement>('.vcm-cascader-view__clear');
		expect(clear()!.textContent).toBe('清空');

		clear()!.click();
		await flush();
		expect(calls).toEqual(['clear', 'change']);
		expect(value.value).toEqual([]);
		expect(getTabs()).toEqual(['请选择']);
		expect(clear()).toBeNull();
		wrapper.unmount();
	});
});

describe('MCascader', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('MListItem 显示 formatter 结果或 placeholder；选到最后一级自动提交并关闭', async () => {
		const value = ref<any[]>([]);
		const onChange = vi.fn();
		const wrapper = mount(() => (
			<MCascader v-model={value.value} data={createData()} label="分类" onChange={onChange} />
		), { attachTo: document.body });
		await flush();
		expect(wrapper.text()).toContain('请选择');

		await wrapper.find('.vcm-cascader').trigger('click');
		await flush();
		// 没有工具栏：标题栏带关闭按钮
		expect(document.querySelector('.vcm-picker-popup__header')).toBeNull();
		expect(document.querySelector('.vcm-popup__close, .vcm-popup [class*="close"]')).toBeTruthy();

		await clickOption('分组 A');
		await clickOption('条目 A-2');
		expect(value.value).toEqual([1, 12]);
		expect(onChange).toHaveBeenCalledWith([1, 12], ['分组 A', '条目 A-2']);
		expect(wrapper.text()).toContain('分组 A / 条目 A-2');
		wrapper.unmount();
	});

	it('confirm：显示工具栏，路径没到最后一级时确定置灰；取消不提交', async () => {
		const value = ref<any[]>([]);
		const onCancel = vi.fn();
		const wrapper = mount(() => (
			<MCascader v-model={value.value} data={createData()} confirm onCancel={onCancel} />
		), { attachTo: document.body });
		await flush();
		await wrapper.find('.vcm-cascader').trigger('click');
		await flush();

		const ok = () => document.querySelector('.vcm-picker-popup__item.is-right') as HTMLElement;
		expect(ok().classList).toContain('is-disabled');

		await clickOption('分组 A');
		await clickOption('条目 A-2');
		// 不自动关闭
		expect(value.value).toEqual([]);
		expect(ok().classList).not.toContain('is-disabled');

		(document.querySelector('.vcm-picker-popup__item.is-left') as HTMLElement).click();
		await flush();
		expect(onCancel).toHaveBeenCalled();
		expect(value.value).toEqual([]);

		await wrapper.find('.vcm-cascader').trigger('click');
		await flush();
		await sleep(10);
		await clickOption('分组 B');
		await clickOption('条目 B-1');
		ok().click();
		await flush();
		expect(value.value).toEqual([2, 21]);
		wrapper.unmount();
	});

	it('confirm=\'bottom\'：底部「确定」提交，路径没到最后一级时置灰', async () => {
		const onOk = vi.fn();
		const leaf = MCascader.open({ value: [], data: createData(), confirm: 'bottom', onOk });
		await flush();
		expect(document.querySelector('.vcm-picker-popup__header')).toBeNull();
		const ok = () => document.querySelector('.vcm-picker-popup__footer .vcm-picker-popup__button') as HTMLButtonElement;
		expect(ok().classList).toContain('is-disabled');

		await clickOption('分组 B');
		await clickOption('条目 B-1');
		// 不自动关闭
		expect(onOk).not.toHaveBeenCalled();
		expect(ok().classList).not.toContain('is-disabled');
		ok().click();
		await flush();
		expect(onOk).toHaveBeenCalledWith([2, 21], ['分组 B', '条目 B-1']);
		leaf.destroy();
	});

	it('changeOnSelect：工具栏可在任意一级确定，选到最后一级仍自动关闭', async () => {
		const onOk = vi.fn();
		const leaf = MCascader.open({ value: [], data: createData(), changeOnSelect: true, onOk });
		await flush();
		const ok = document.querySelector('.vcm-picker-popup__item.is-right') as HTMLElement;
		expect(ok.classList).not.toContain('is-disabled');

		await clickOption('分组 A');
		ok.click();
		await flush();
		expect(onOk).toHaveBeenCalledWith([1], ['分组 A']);
		leaf.destroy();
		await flush();

		const onOk2 = vi.fn();
		const leaf2 = MCascader.open({ modelValue: [], data: createData(), changeOnSelect: true, onOk: onOk2 });
		await flush();
		await clickOption('分组 B');
		await clickOption('条目 B-1');
		expect(onOk2).toHaveBeenCalledWith([2, 21], ['分组 B', '条目 B-1']);
		leaf2.destroy();
	});

	it('clearable：不需要确认时清空即提交空值并关闭；confirm 时由确定提交空值', async () => {
		const value = ref<any>([1, 12]);
		const onClear = vi.fn();
		const wrapper = mount(() => (
			<MCascader v-model={value.value} data={createData()} clearable onClear={onClear} />
		), { attachTo: document.body });
		await flush();
		await wrapper.find('.vcm-cascader').trigger('click');
		await flush();
		(document.querySelector('.vcm-cascader-view__clear') as HTMLElement).click();
		await flush();
		expect(onClear).toHaveBeenCalledTimes(1);
		expect(value.value).toEqual([]);
		wrapper.unmount();
		document.body.innerHTML = '';

		const onOk = vi.fn();
		const leaf = MCascader.open({ modelValue: 112, checkStrategy: 'child', data: createData(), confirm: true, clearable: true, onOk });
		await flush();
		(document.querySelector('.vcm-cascader-view__clear') as HTMLElement).click();
		await flush();
		expect(onOk).not.toHaveBeenCalled();
		const ok = document.querySelector('.vcm-picker-popup__item.is-right') as HTMLElement;
		expect(ok.classList).not.toContain('is-disabled');
		ok.click();
		await flush();
		expect(onOk).toHaveBeenCalledWith(undefined, []);
		leaf.destroy();
	});
});
