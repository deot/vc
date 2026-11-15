// @vitest-environment jsdom

import { MSelect } from '@deot/vc-components';
import { mount } from '@vue/test-utils';
import { nextTick, ref } from 'vue';
import { vi } from 'vitest';

const sleep = (ms = 0) => new Promise<void>(r => setTimeout(r, ms));
const flush = async () => {
	await nextTick();
	await sleep(0);
	await nextTick();
};

const SOURCE = [
	{ value: 1, label: '苹果' },
	{ value: 2, label: '香蕉' },
	{ value: 3, label: '苹果汁' },
	{ value: 4, label: '橙子' }
];
// 模拟服务端：按关键词返回匹配的项，空关键词返回前两项
const query = (keyword: string) => (keyword ? SOURCE.filter(i => i.label.includes(keyword)) : SOURCE.slice(0, 2));

const getLabels = () => Array.from(document.querySelectorAll('.vcm-select-view__option .vcm-select-view__label')).map(i => i.textContent);
const clickOption = async (label: string) => {
	const el = Array.from(document.querySelectorAll<HTMLElement>('.vcm-select-view__option'))
		.find(i => i.querySelector('.vcm-select-view__label')!.textContent === label);
	expect(el, label).toBeTruthy();
	el!.click();
	await flush();
};
const search = async (keyword: string) => {
	const input = document.querySelector<HTMLInputElement>('.vcm-select-view__search input')!;
	input.value = keyword;
	input.dispatchEvent(new Event('input'));
	await flush();
};
const getRight = () => document.querySelector('.vcm-picker-popup__item.is-right') as HTMLElement;

describe('MSelect 远程搜索', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('打开时没有数据按空关键词加载；搜索词经防抖后加载，期间显示加载图标；触发区把 data 推进弹层', async () => {
		const value = ref<any>();
		const data = ref<any[]>([]);
		const loadData = vi.fn(async (keyword: string) => {
			await sleep(50);
			data.value = query(keyword);
		});
		const wrapper = mount(() => (
			<MSelect v-model={value.value} data={data.value} loadData={loadData} searchable />
		), { attachTo: document.body });
		await flush();
		expect(loadData).not.toHaveBeenCalled();

		await wrapper.find('.vcm-select').trigger('click');
		await flush();
		expect(loadData).toHaveBeenCalledTimes(1);
		expect(loadData.mock.calls[0][0]).toBe('');
		expect(document.querySelector('.vcm-select-view__loading')).not.toBeNull();
		// 加载期间不提示无结果
		expect(document.querySelector('.vcm-select-view__empty')).toBeNull();
		await sleep(80);
		await flush();
		expect(getLabels()).toEqual(['苹果', '香蕉']);
		expect(document.querySelector('.vcm-select-view__loading')).toBeNull();

		await search('苹');
		await search('苹果');
		expect(loadData).toHaveBeenCalledTimes(1);
		await sleep(300);
		expect(loadData).toHaveBeenCalledTimes(2);
		expect(loadData.mock.calls[1][0]).toBe('苹果');
		await sleep(80);
		await flush();
		expect(getLabels()).toEqual(['苹果', '苹果汁']);

		await clickOption('苹果汁');
		expect(value.value).toBe(3);
		expect(wrapper.text()).toContain('苹果汁');

		// 调用方的数据换成别的关键词的结果：触发区的文字沿用上次查到的
		data.value = query('橙');
		await flush();
		expect(wrapper.text()).toContain('苹果汁');
		wrapper.unmount();
	});

	it('重新打开：数据是按关键词加载的，按空关键词重新加载；对得上空关键词时不加载', async () => {
		const data = ref<any[]>(query(''));
		const loadData = vi.fn(async (keyword: string) => {
			data.value = query(keyword);
		});
		const wrapper = mount(() => (
			<MSelect data={data.value} loadData={loadData} searchable confirm />
		), { attachTo: document.body });
		await flush();

		await wrapper.find('.vcm-select').trigger('click');
		await flush();
		// 已有数据、还没按关键词加载过：不加载
		expect(loadData).not.toHaveBeenCalled();
		await search('橙');
		await sleep(300);
		await flush();
		expect(loadData).toHaveBeenLastCalledWith('橙', expect.anything());
		expect(getLabels()).toEqual(['橙子']);

		(document.querySelector('.vcm-picker-popup__item.is-left') as HTMLElement).click();
		await sleep(350);
		await flush();

		await wrapper.find('.vcm-select').trigger('click');
		await flush();
		expect(loadData).toHaveBeenCalledTimes(2);
		expect(loadData).toHaveBeenLastCalledWith('', expect.anything());
		await flush();
		expect(getLabels()).toEqual(['苹果', '香蕉']);
		wrapper.unmount();
	});

	it('多选：结果里没有的已选项仍保留并带文字提交；触发区显示弹层里查到的文字', async () => {
		const data = ref<any[]>([]);
		const loadData = async (keyword: string) => {
			data.value = query(keyword);
		};
		const onOk = vi.fn();
		const wrapper = mount(() => (
			<MSelect modelValue={[]} data={data.value} max={0} loadData={loadData} searchable onOk={onOk} />
		), { attachTo: document.body });
		await flush();
		await wrapper.find('.vcm-select').trigger('click');
		await flush();
		await clickOption('香蕉');

		await search('橙');
		await sleep(300);
		await flush();
		expect(getLabels()).toEqual(['橙子']);
		await clickOption('橙子');
		expect(document.querySelector('.vcm-select-summary__count')!.textContent).toContain('2');

		getRight().click();
		await flush();
		expect(onOk).toHaveBeenCalledWith([2, 4], ['香蕉', '橙子']);
		// 香蕉只在弹层里见过（提交时 data 已是「橙」的结果）
		expect(wrapper.find('.vcm-select').text()).toContain('香蕉, 橙子');

		// 再次打开（数据过期，按空关键词重新加载），已选项的文字仍在
		await wrapper.find('.vcm-select').trigger('click');
		await flush();
		await flush();
		expect(document.querySelector('.vcm-select-summary__count')!.textContent).toContain('2');
		getRight().click();
		await flush();
		expect(onOk).toHaveBeenLastCalledWith([2, 4], ['香蕉', '橙子']);
		wrapper.unmount();
	});

	it('open：没有触发区时，loadData 解析出的数组作为结果；未开启 searchable 时不调用', async () => {
		const loadData = vi.fn(async (keyword: string) => query(keyword));
		const leaf = MSelect.open({ data: [], loadData, searchable: true });
		await flush();
		await sleep(10);
		await flush();
		expect(getLabels()).toEqual(['苹果', '香蕉']);
		await search('橙');
		await sleep(300);
		await flush();
		expect(getLabels()).toEqual(['橙子']);
		leaf.destroy();
		await flush();

		const loadData2 = vi.fn(async () => []);
		const leaf2 = MSelect.open({ data: [], loadData: loadData2 });
		await flush();
		expect(loadData2).not.toHaveBeenCalled();
		leaf2.destroy();
	});
});
