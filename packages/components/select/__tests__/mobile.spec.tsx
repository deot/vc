// @vitest-environment jsdom

import { MSelect, MSelectView } from '@deot/vc-components';
import { mount } from '@vue/test-utils';
import { h, nextTick, ref } from 'vue';
import { vi } from 'vitest';
import { createSearchRegex, flattenData, getSelectLabels, getSelectRows, isMaxReached } from '../utils';

const sleep = (ms = 0) => new Promise<void>(r => setTimeout(r, ms));
const flush = async () => {
	await nextTick();
	await sleep(0);
	await nextTick();
};

const createData = () => [
	{ value: 1, label: '选项一' },
	{ value: 2, label: '选项二', description: '说明文字' },
	{ value: 3, label: '选项三' },
	{ value: 4, label: '选项四', disabled: true },
	{ value: 5, label: '选项五' }
];

const groupedData = [
	{ value: 'a', label: '分组 A', children: [{ value: 1, label: '条目甲' }, { value: 2, label: '条目乙' }] },
	{ value: 'b', label: '分组 B', children: [{ value: 3, label: '条目丙' }] },
	{ value: 4, label: '独立条目' }
];

const getOptions = (root: ParentNode = document) => {
	return Array.from(root.querySelectorAll<HTMLElement>('.vcm-select-view__option'));
};
const getOption = (label: string, root: ParentNode = document) => {
	const el = getOptions(root).find(i => i.querySelector('.vcm-select-view__label')!.textContent === label);
	expect(el, label).toBeTruthy();
	return el!;
};
const clickOption = async (label: string, root: ParentNode = document) => {
	getOption(label, root).click();
	await flush();
};
const getLeft = () => document.querySelector('.vcm-picker-popup__item.is-left') as HTMLElement | null;
const getRight = () => document.querySelector('.vcm-picker-popup__item.is-right') as HTMLElement | null;
const getFooterButtons = () => Array.from(document.querySelectorAll<HTMLElement>('.vcm-picker-popup__footer .vcm-picker-popup__button'));

describe('select utils（移动端用到的）', () => {
	it('getSelectLabels 在铺平的选项中查找（含分组内的）；isMaxReached 只在多选且有上限时生效', () => {
		expect(getSelectLabels([3, 1], flattenData(createData(), { parent: true, cascader: true }))).toEqual(['选项三', '选项一']);
		expect(getSelectLabels([2], flattenData(groupedData, { parent: true, cascader: true }))).toEqual(['条目乙']);
		expect(isMaxReached(2, 2)).toBe(true);
		expect(isMaxReached(2, 1)).toBe(false);
		expect(isMaxReached(0, 99)).toBe(false);
		expect(isMaxReached(1, 1)).toBe(false);
	});

	it('getSelectRows：分组铺平，按搜索词过滤，没有命中项的分组不显示', () => {
		const rows = getSelectRows(groupedData, createSearchRegex('乙'));
		expect(rows.map(i => [i.item.label, !!i.group])).toEqual([['分组 A', true], ['条目乙', false]]);
		expect(getSelectRows(groupedData, createSearchRegex('')).length).toBe(6);
	});
});

describe('MSelectView', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('单选：点选替换并提交，点已选中的项不变；禁用项点不动；说明文字', async () => {
		const value = ref<any>(1);
		const onChange = vi.fn();
		const onSelect = vi.fn();
		const wrapper = mount(() => (
			<MSelectView v-model={value.value} data={createData()} onChange={onChange} onSelect={onSelect} />
		), { attachTo: document.body });
		await flush();

		expect(getOption('选项一').classList).toContain('is-selected');
		expect(getOption('选项二').querySelector('.vcm-select-view__description')!.textContent).toBe('说明文字');
		// 单选且不可清空：没有汇总栏
		expect(document.querySelector('.vcm-select-view__summary')).toBeNull();

		await clickOption('选项三');
		expect(value.value).toBe(3);
		expect(onChange).toHaveBeenLastCalledWith(3, ['选项三']);
		expect(onSelect).toHaveBeenLastCalledWith(expect.objectContaining({ value: 3, selected: true }));

		await clickOption('选项三');
		expect(value.value).toBe(3);
		expect(onChange).toHaveBeenCalledTimes(1);
		expect(onSelect).toHaveBeenCalledTimes(2);

		await clickOption('选项四');
		expect(value.value).toBe(3);
		expect(onSelect).toHaveBeenCalledTimes(2);
		wrapper.unmount();
	});

	it('多选：切换选中，汇总栏显示数量与上限，选满后未选中的项禁用；max 0 不限', async () => {
		const value = ref<any[]>([]);
		const max = ref(2);
		const wrapper = mount(() => (
			<MSelectView v-model={value.value} data={createData()} max={max.value} />
		), { attachTo: document.body });
		await flush();
		const count = () => document.querySelector('.vcm-select-view__count')!.textContent;
		expect(count()).toBe('已选 0/2');

		await clickOption('选项一');
		await clickOption('选项三');
		expect(value.value).toEqual([1, 3]);
		expect(count()).toBe('已选 2/2');
		expect(getOption('选项二').classList).toContain('is-disabled');
		expect(getOption('选项一').classList).not.toContain('is-disabled');

		await clickOption('选项二');
		expect(value.value).toEqual([1, 3]);

		await clickOption('选项一');
		expect(value.value).toEqual([3]);
		expect(getOption('选项二').classList).not.toContain('is-disabled');

		max.value = 0;
		await flush();
		await clickOption('选项一');
		await clickOption('选项二');
		await clickOption('选项五');
		expect(value.value).toEqual([3, 1, 2, 5]);
		expect(count()).toBe('已选 4');
		wrapper.unmount();
	});

	it('字符串值按分隔符解析与输出，numerable 转为数字', async () => {
		const value = ref<any>('a;c');
		const data = [{ value: 'a', label: '甲' }, { value: 'b', label: '乙' }, { value: 'c', label: '丙' }];
		const wrapper = mount(() => (
			<MSelectView v-model={value.value} data={data} max={0} separator=";" />
		), { attachTo: document.body });
		await flush();
		expect(getOptions().filter(i => i.classList.contains('is-selected')).length).toBe(2);
		await clickOption('乙');
		expect(value.value).toBe('a;c;b');
		wrapper.unmount();

		const numbers = ref<any>('1,3');
		const wrapper2 = mount(() => (
			<MSelectView v-model={numbers.value} data={createData()} max={0} numerable />
		), { attachTo: document.body });
		await flush();
		expect(getOptions().filter(i => i.classList.contains('is-selected')).length).toBe(2);
		await clickOption('选项五');
		expect(numbers.value).toBe('1,3,5');
		wrapper2.unmount();
	});

	it('搜索：过滤并高亮，没有命中项的分组不显示，无结果时提示；分组标题', async () => {
		const wrapper = mount(() => (
			<MSelectView data={groupedData} searchable searchPlaceholder="搜索条目" />
		), { attachTo: document.body });
		await flush();
		expect(Array.from(document.querySelectorAll('.vcm-select-view__group')).map(i => i.textContent)).toEqual(['分组 A', '分组 B']);
		const input = document.querySelector('.vcm-select-view__search input') as HTMLInputElement;
		expect(input.placeholder).toBe('搜索条目');

		input.value = '丙';
		input.dispatchEvent(new Event('input'));
		await flush();
		expect(Array.from(document.querySelectorAll('.vcm-select-view__group')).map(i => i.textContent)).toEqual(['分组 B']);
		expect(getOptions().length).toBe(1);
		expect(document.querySelector('.vcm-select-view__option .vc-select-highlight')!.textContent).toBe('丙');

		input.value = '不存在';
		input.dispatchEvent(new Event('input'));
		await flush();
		expect(document.querySelector('.vcm-select-view__empty')!.textContent).toBe('暂无匹配数据');
		wrapper.unmount();
	});

	it('clearable：汇总栏显示清空，先 clear 再提交空值', async () => {
		const value = ref<any>(2);
		const calls: string[] = [];
		const wrapper = mount(() => (
			<MSelectView
				v-model={value.value}
				data={createData()}
				clearable
				nullValue=""
				onClear={() => calls.push('clear')}
				onChange={(v: any) => calls.push(`change:${v}`)}
			/>
		), { attachTo: document.body });
		await flush();
		(document.querySelector('.vcm-select-view__clear') as HTMLElement).click();
		await flush();
		expect(calls).toEqual(['clear', 'change:']);
		expect(value.value).toBe('');
		expect(document.querySelector('.vcm-select-view__clear')).toBeNull();
		wrapper.unmount();
	});

	it('label 插槽优先于 renderLabel，参数为 { label, row, index, selected }', async () => {
		const renderLabel = vi.fn(({ label }: any) => `R-${label}`);
		const wrapper = mount(() => (
			<MSelectView modelValue={2} data={createData()} renderLabel={renderLabel} />
		), { attachTo: document.body });
		await flush();
		expect(getOptions()[0].textContent).toBe('R-选项一');
		expect(renderLabel.mock.calls[1][0]).toEqual(expect.objectContaining({ label: '选项二', index: 1, selected: true }));
		wrapper.unmount();

		const slotted = mount(() => (
			<MSelectView modelValue={2} data={createData()} renderLabel={renderLabel}>
				{{ label: ({ label, selected }: any) => h('b', `S-${label}-${selected}`) }}
			</MSelectView>
		), { attachTo: document.body });
		await flush();
		expect(getOptions()[1].querySelector('.vcm-select-view__label')!.textContent).toBe('S-选项二-true');
		slotted.unmount();
	});
});

describe('MSelect', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('MListItem 显示选中的文字或 placeholder；单选点选即提交并关闭', async () => {
		const value = ref<any>();
		const onChange = vi.fn();
		const onVisibleChange = vi.fn();
		const wrapper = mount(() => (
			<MSelect
				v-model={value.value}
				data={createData()}
				label="类型"
				title="选择类型"
				onChange={onChange}
				onVisibleChange={onVisibleChange}
			/>
		), { attachTo: document.body });
		await flush();
		expect(wrapper.text()).toContain('请选择');

		await wrapper.find('.vcm-select').trigger('click');
		await flush();
		// 没有工具栏：标题栏带关闭按钮
		expect(document.querySelector('.vcm-picker-popup__header')).toBeNull();
		expect(document.querySelector('.vcm-popup__title')!.textContent).toBe('选择类型');
		expect(onVisibleChange).toHaveBeenCalledWith(true);

		await clickOption('选项二');
		expect(value.value).toBe(2);
		expect(onChange).toHaveBeenCalledWith(2, ['选项二']);
		expect(onVisibleChange).toHaveBeenLastCalledWith(false);
		expect(wrapper.text()).toContain('选项二');
		wrapper.unmount();
	});

	it('多选：顶部工具栏，确定提交，取消丢弃；不可清空时一项都没选不能确定', async () => {
		const value = ref<any[]>([]);
		const onCancel = vi.fn();
		const wrapper = mount(() => (
			<MSelect v-model={value.value} data={createData()} max={3} onCancel={onCancel} formatter={(labels: string[]) => labels.join('、')} />
		), { attachTo: document.body });
		await flush();
		await wrapper.find('.vcm-select').trigger('click');
		await flush();

		expect(getRight()!.classList).toContain('is-disabled');
		await clickOption('选项一');
		await clickOption('选项五');
		expect(value.value).toEqual([]);
		expect(getRight()!.classList).not.toContain('is-disabled');

		getLeft()!.click();
		await flush();
		expect(onCancel).toHaveBeenCalled();
		expect(value.value).toEqual([]);

		await wrapper.find('.vcm-select').trigger('click');
		await flush();
		// 重新打开时回到已提交的值
		expect(getOptions().some(i => i.classList.contains('is-selected'))).toBe(false);
		await clickOption('选项三');
		await clickOption('选项一');
		getRight()!.click();
		await flush();
		expect(value.value).toEqual([3, 1]);
		expect(wrapper.text()).toContain('选项三、选项一');
		wrapper.unmount();
	});

	it('confirm=true：单选也由确定提交', async () => {
		const onOk = vi.fn();
		const leaf = MSelect.open({ value: 1, data: createData(), confirm: true, onOk });
		await flush();
		await clickOption('选项三');
		expect(onOk).not.toHaveBeenCalled();
		getRight()!.click();
		await flush();
		expect(onOk).toHaveBeenCalledWith(3, ['选项三']);
		leaf.destroy();
	});

	it('confirm 为 bottom：标题栏带关闭，底部为清空 / 确定；清空只清弹层内的值', async () => {
		const onOk = vi.fn();
		const leaf = MSelect.open({ modelValue: [1, 2], data: createData(), max: 0, confirm: 'bottom', clearable: true, onOk });
		await flush();
		expect(document.querySelector('.vcm-picker-popup__header')).toBeNull();
		expect(document.querySelector('.vcm-select-popup')!.classList).toContain('is-bottom');
		// 汇总栏不再显示清空
		expect(document.querySelector('.vcm-select-view__clear')).toBeNull();

		const [clear, ok] = getFooterButtons();
		expect(clear.textContent).toBe('清空');
		expect(ok.textContent).toBe('确定');
		clear.click();
		await flush();
		expect(onOk).not.toHaveBeenCalled();
		expect(getOptions().some(i => i.classList.contains('is-selected'))).toBe(false);
		ok.click();
		await sleep(300);
		await flush();
		expect(onOk).toHaveBeenCalledWith([], []);
		leaf.destroy();
		await flush();

		// 不可清空：只有确定
		const leaf2 = MSelect.open({ modelValue: [], data: createData(), max: 0, confirm: 'bottom' });
		await flush();
		expect(getFooterButtons().map(i => i.textContent)).toEqual(['确定']);
		leaf2.destroy();
	});

	it('clearable 单选：清空即提交空值并关闭', async () => {
		const value = ref<any>(2);
		const onClear = vi.fn();
		const wrapper = mount(() => (
			<MSelect v-model={value.value} data={createData()} clearable onClear={onClear} />
		), { attachTo: document.body });
		await flush();
		await wrapper.find('.vcm-select').trigger('click');
		await flush();
		(document.querySelector('.vcm-select-view__clear') as HTMLElement).click();
		await flush();
		expect(onClear).toHaveBeenCalledTimes(1);
		expect(value.value).toBe(undefined);
		expect(wrapper.text()).toContain('请选择');
		wrapper.unmount();
	});

	it('label 插槽在弹层中渲染；disabled 不打开', async () => {
		const disabled = ref(false);
		const wrapper = mount(() => (
			<MSelect modelValue={1} data={createData()} disabled={disabled.value}>
				{{ label: ({ label }: any) => h('i', `S-${label}`) }}
			</MSelect>
		), { attachTo: document.body });
		await flush();
		await wrapper.find('.vcm-select').trigger('click');
		await flush();
		expect(getOptions()[0].textContent).toBe('S-选项一');
		wrapper.unmount();
		document.body.innerHTML = '';

		disabled.value = true;
		const wrapper2 = mount(() => (
			<MSelect modelValue={1} data={createData()} disabled />
		), { attachTo: document.body });
		await flush();
		await wrapper2.find('.vcm-select').trigger('click');
		await flush();
		expect(document.querySelector('.vcm-select-view')).toBeNull();
		expect(wrapper2.find('.vcm-select').classes()).toContain('is-disabled');
		wrapper2.unmount();
	});
});
