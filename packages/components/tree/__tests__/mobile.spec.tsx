// @vitest-environment jsdom

import { MTree, Tree } from '@deot/vc-components';
import { mount, enableAutoUnmount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { vi } from 'vitest';

enableAutoUnmount(afterEach);

const sleep = (time = 0) => new Promise(resolve => setTimeout(resolve, time));
const flush = async (rounds = 5) => {
	for (let i = 0; i < rounds; i++) {
		await nextTick();
		await sleep(0);
	}
};

const buildData = () => [
	{
		value: '1',
		label: 'label-1',
		children: [
			{ value: '1-1', label: 'label-1-1', children: [{ value: '1-1-1', label: 'label-1-1-1' }] }
		]
	},
	{ value: '2', label: 'label-2' }
];

const getPaddings = (wrapper: any) => wrapper.findAll('.vc-tree-node__content').map((item: any) => item.element.style.paddingLeft);

describe('MTree', () => {
	let rect: ReturnType<typeof vi.spyOn>;

	// useRem 的探针：jsdom 不做布局，宽度（750 个单位的 px）由这里给出
	beforeEach(() => {
		const origin = HTMLElement.prototype.getBoundingClientRect;
		rect = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
			return this.style.width.includes('--vc-rem') ? { width: 375 } as DOMRect : origin.call(this);
		});
	});

	afterEach(() => {
		rect.mockRestore();
	});

	it('根节点为桌面端结构加标记类 vcm-tree，属性与事件同 Tree', () => {
		const wrapper = mount(() => (<MTree data={buildData()} />));
		expect(wrapper.classes()).toEqual(expect.arrayContaining(['vc-tree', 'vcm-tree']));
		expect(wrapper.attributes('role')).toBe('tree');
		expect(wrapper.findAll('.vc-tree-node').length).toBe(2);

		expect(Object.keys((MTree as any).props)).toEqual(Object.keys((Tree as any).props));
		expect((MTree as any).emits).toEqual((Tree as any).emits);
	});

	it('Tree 的根节点没有标记类', () => {
		const wrapper = mount(() => (<Tree data={buildData()} />));
		expect(wrapper.classes()).toContain('vc-tree');
		expect(wrapper.classes()).not.toContain('vcm-tree');
	});

	it('数字 indent 为 750 稿长度，默认 32；Tree 仍为 px', () => {
		const mobile = mount(() => (<MTree data={buildData()} defaultExpandAll />));
		expect(getPaddings(mobile)).toEqual([
			'calc(var(--vc-rem) * 0)',
			'calc(var(--vc-rem) * 32)',
			'calc(var(--vc-rem) * 64)',
			'calc(var(--vc-rem) * 0)'
		]);

		const custom = mount(() => (<MTree data={buildData()} indent={40} defaultExpandAll />));
		expect(getPaddings(custom)[2]).toBe('calc(var(--vc-rem) * 80)');

		const desktop = mount(() => (<Tree data={buildData()} defaultExpandAll />));
		expect(getPaddings(desktop)).toEqual(['0px', '18px', '36px', '0px']);
	});

	it('多选框为 MCheckbox，勾选联动与 v-model 不变', async () => {
		const handleChange = vi.fn();
		const wrapper = mount(() => (
			<MTree modelValue={[]} data={buildData()} showCheckbox defaultExpandAll onUpdate:modelValue={handleChange} />
		));
		expect(wrapper.findAll('.vcm-checkbox').length).toBe(4);
		expect(wrapper.find('.vc-checkbox').exists()).toBe(false);
		// 多选框不单独占用 Tab
		expect(wrapper.find('.vcm-checkbox input').attributes('tabindex')).toBe('-1');

		await wrapper.find('.vcm-checkbox input').setValue(true);
		await flush();
		expect(handleChange).toHaveBeenCalledTimes(1);
		expect(handleChange.mock.calls[0][0]).toEqual(['1', '1-1', '1-1-1']);
		expect(wrapper.findAll('.vcm-checkbox.is-checked').length).toBe(3);
	});

	it('点多选框不触发行的点击（不展开、不改变当前节点）', async () => {
		const handleClick = vi.fn();
		const wrapper = mount(() => (<MTree data={buildData()} showCheckbox onNode-click={handleClick} />));
		await wrapper.find('.vcm-checkbox').trigger('click');
		await flush();
		expect(handleClick).not.toHaveBeenCalled();
		expect(wrapper.findAll('.vc-tree-node').length).toBe(2);
	});

	it('懒加载期间显示 MSpin', async () => {
		let resolve!: (value: any[]) => void;
		const loadData = () => new Promise<any[]>(r => (resolve = r));
		const wrapper = mount(() => (
			<MTree data={[{ value: '1', label: 'label-1' }]} lazy loadData={loadData} />
		));
		await wrapper.find('.vc-tree-node__content').trigger('click');
		await nextTick();
		const spin = wrapper.find('.vc-tree-node__loading-icon');
		expect(spin.exists()).toBe(true);
		expect(spin.classes()).toContain('vcm-spin');

		resolve([{ value: '1-1', label: 'label-1-1', isLeaf: true }]);
		await flush();
		expect(wrapper.find('.vc-tree-node__loading-icon').exists()).toBe(false);
	});

	it('virtualized 时内部为 MRecycleList；Tree 为 RecycleList', async () => {
		const mobile = mount(() => (<MTree data={buildData()} virtualized />), { attachTo: document.body });
		await flush();
		expect(mobile.find('.vc-select-list > .vcm-recycle-list').exists()).toBe(true);

		const desktop = mount(() => (<Tree data={buildData()} virtualized />), { attachTo: document.body });
		await flush();
		expect(desktop.find('.vc-select-list > .vc-recycle-list').exists()).toBe(true);
		expect(desktop.find('.vcm-recycle-list').exists()).toBe(false);
	});

	it('空状态与 highlightCurrent 同 Tree', async () => {
		const wrapper = mount(() => (<MTree data={[]} emptyText="empty" />));
		expect(wrapper.find('.vc-tree__empty-text').text()).toBe('empty');

		const tree = mount(() => (<MTree data={buildData()} highlightCurrent />));
		expect(tree.classes()).toContain('vc-tree--highlight-current');
		await tree.find('.vc-tree-node__content').trigger('click');
		expect(tree.find('.vc-tree-node').classes()).toContain('is-current');
	});
});
