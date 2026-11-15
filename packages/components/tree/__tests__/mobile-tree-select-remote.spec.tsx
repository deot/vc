// @vitest-environment jsdom

import { MTreeSelect } from '@deot/vc-components';
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
	{ value: 'a', label: '分组 A', children: [{ value: 'a-1', label: '苹果' }, { value: 'a-2', label: '香蕉' }] },
	{ value: 'b', label: '分组 B', children: [{ value: 'b-1', label: '橙子' }, { value: 'b-2', label: '苹果汁' }] }
];
// 模拟服务端：按关键词只返回命中的叶子（连同它的分组）
const query = (keyword: string) => {
	if (!keyword) return SOURCE;
	return SOURCE
		.map(group => ({ ...group, children: group.children.filter(i => i.label.includes(keyword)) }))
		.filter(group => group.children.length);
};

const getRows = () => Array.from(document.querySelectorAll<HTMLElement>('.vcm-tree-select-panel .vc-tree-node'))
	.map(row => row.querySelector(':scope > .vc-tree-node__content')!.textContent);
const getRow = (label: string) => Array.from(document.querySelectorAll<HTMLElement>('.vcm-tree-select-panel .vc-tree-node'))
	.find(row => row.querySelector(':scope > .vc-tree-node__content')!.textContent === label)!;
const check = async (label: string) => {
	const input = getRow(label).querySelector<HTMLInputElement>(':scope > .vc-tree-node__content .vcm-checkbox input')!;
	input.checked = true;
	input.dispatchEvent(new Event('change', { bubbles: true }));
	await flush();
};
const search = async (keyword: string) => {
	const input = document.querySelector<HTMLInputElement>('.vcm-tree-select-panel__search input')!;
	input.value = keyword;
	input.dispatchEvent(new Event('input'));
	await flush();
};

describe('MTreeSelect 远程搜索', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('按关键词加载，只高亮不过滤；结果之外的已选值不受勾选影响，文字沿用上次查到的', async () => {
		const value = ref<any[]>(['a-2']);
		const data = ref<any[]>(SOURCE);
		const loadData = vi.fn(async (keyword: string) => {
			await sleep(100);
			data.value = query(keyword);
		});
		const wrapper = mount(() => (
			<MTreeSelect
				v-model={value.value}
				data={data.value}
				max={0}
				checkStrategy="child"
				loadData={loadData}
				searchable
				formatter={(labels: string[]) => labels.join('、')}
			/>
		), { attachTo: document.body });
		await flush();
		expect(wrapper.text()).toContain('分组 A / 香蕉');

		await wrapper.find('.vcm-tree-select').trigger('click');
		await flush();
		// 已有数据、还没按关键词加载过：不加载
		expect(loadData).not.toHaveBeenCalled();

		await search('橙');
		await sleep(300);
		expect(loadData).toHaveBeenLastCalledWith('橙', expect.anything());
		expect(document.querySelector('.vcm-tree-select-panel__loading')).not.toBeNull();
		await sleep(120);
		await flush();
		expect(document.querySelector('.vcm-tree-select-panel__loading')).toBeNull();
		expect(getRows()).toEqual(['分组 B', '橙子']);
		expect(getRow('橙子').querySelector('.vc-select-highlight')).not.toBeNull();

		await check('橙子');
		(document.querySelector('.vcm-picker-popup__item.is-right') as HTMLElement).click();
		await flush();
		// a-2 不在这次的结果里，仍然保留
		expect(value.value).toEqual(['a-2', 'b-1']);
		expect(wrapper.text()).toContain('分组 A / 香蕉、分组 B / 橙子');
		wrapper.unmount();
	});

	it('触发区显示弹层里查到的已选值（提交时 data 已是别的关键词的结果）', async () => {
		const value = ref<any[]>([]);
		const data = ref<any[]>([]);
		const loadData = async (keyword: string) => {
			data.value = query(keyword);
		};
		const wrapper = mount(() => (
			<MTreeSelect
				v-model={value.value}
				data={data.value}
				max={0}
				checkStrategy="child"
				loadData={loadData}
				searchable
				formatter={(labels: string[]) => labels.join('、')}
			/>
		), { attachTo: document.body });
		await flush();
		await wrapper.find('.vcm-tree-select').trigger('click');
		await flush();
		await flush();
		getRow('分组 A').querySelector<HTMLElement>(':scope > .vc-tree-node__content .vc-tree-node__expand-icon')!.click();
		await flush();
		await check('苹果');

		await search('橙');
		await sleep(300);
		await flush();
		await check('橙子');
		(document.querySelector('.vcm-picker-popup__item.is-right') as HTMLElement).click();
		await flush();
		expect(value.value).toEqual(['a-1', 'b-1']);
		expect(wrapper.text()).toContain('分组 A / 苹果、分组 B / 橙子');
		wrapper.unmount();
	});

	it('open：没有触发区时，loadData 解析出的数组作为结果', async () => {
		const loadData = vi.fn(async (keyword: string) => query(keyword));
		const onOk = vi.fn();
		const leaf = MTreeSelect.open({ data: [], loadData, searchable: true, checkStrategy: 'child', onOk });
		await flush();
		await sleep(10);
		await flush();
		expect(loadData).toHaveBeenCalledWith('', expect.anything());
		expect(getRows()).toEqual(['分组 A', '分组 B']);

		await search('苹果汁');
		await sleep(300);
		await flush();
		expect(getRows()).toEqual(['分组 B', '苹果汁']);
		getRow('苹果汁').querySelector<HTMLElement>(':scope > .vc-tree-node__content')!.click();
		await flush();
		expect(onOk).toHaveBeenCalledWith('b-2', ['分组 B / 苹果汁']);
		leaf.destroy();
	});
});
