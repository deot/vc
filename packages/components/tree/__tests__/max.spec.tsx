// @vitest-environment jsdom

import { Tree, TreeSelect } from '@deot/vc-components';
import { mount, enableAutoUnmount } from '@vue/test-utils';
import { nextTick, ref } from 'vue';
import { vi } from 'vitest';

enableAutoUnmount(afterEach);

const sleep = (ms = 0) => new Promise<void>(r => setTimeout(r, ms));
const flush = async () => {
	await nextTick();
	await sleep(0);
	await nextTick();
};

const buildData = () => [
	{
		value: '1',
		label: 'label-1',
		children: [
			{ value: '1-1', label: 'label-1-1', children: [{ value: '1-1-1', label: 'label-1-1-1' }] },
			{ value: '1-2', label: 'label-1-2' }
		]
	},
	{
		value: '2',
		label: 'label-2',
		children: [
			{ value: '2-1', label: 'label-2-1' },
			{ value: '2-2', label: 'label-2-2' }
		]
	},
	{ value: '3', label: 'label-3' }
];

// 行：按文字找
const rowOf = (wrapper: any, label: string) => {
	return wrapper.findAll('.vc-tree-node').find((row: any) => row.find(':scope > .vc-tree-node__content .vc-tree-node__label').text() === label)!;
};
const checkboxOf = (wrapper: any, label: string) => rowOf(wrapper, label).find(':scope > .vc-tree-node__content .vc-checkbox');
const clickRow = async (wrapper: any, label: string) => {
	await rowOf(wrapper, label).find('.vc-tree-node__content').trigger('click');
	await flush();
};
const check = async (wrapper: any, label: string, checked = true) => {
	await checkboxOf(wrapper, label).find('input').setValue(checked);
	await flush();
};

describe('Tree max', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('默认 0：不限数量，父子联动，与原来一致', async () => {
		const value = ref<any[]>([]);
		const wrapper = mount(() => (<Tree v-model={value.value} data={buildData()} showCheckbox defaultExpandAll />));
		await check(wrapper, 'label-1');
		expect(value.value).toEqual(['1', '1-1', '1-1-1', '1-2']);
		expect(wrapper.classes()).not.toContain('is-single');
	});

	it('1：互斥单选，父子不联动；复选框也互斥', async () => {
		const value = ref<any[]>([]);
		const wrapper = mount(() => (<Tree v-model={value.value} data={buildData()} max={1} showCheckbox defaultExpandAll />));
		await check(wrapper, 'label-1');
		expect(value.value).toEqual(['1']);
		expect(checkboxOf(wrapper, 'label-1-1').classes()).not.toContain('is-checked');

		await check(wrapper, 'label-2-1');
		expect(value.value).toEqual(['2-1']);
		expect(checkboxOf(wrapper, 'label-1').classes()).not.toContain('is-checked');
		expect(checkboxOf(wrapper, 'label-2').classes()).not.toContain('is-indeterminate');

		// 复选框可以取消
		await check(wrapper, 'label-2-1', false);
		expect(value.value).toEqual([]);
	});

	it('1 + checkOnClickNode：点行即选中、不展开；点已选中的行值不变，仍发出 check', async () => {
		const value = ref<any>('');
		const onCheck = vi.fn();
		const onChange = vi.fn();
		const wrapper = mount(() => (
			<Tree v-model={value.value} data={buildData()} max={1} checkOnClickNode onCheck={onCheck} onChange={onChange} />
		));
		// 没有复选框时根节点带 is-single，选中的节点以主色标出
		expect(wrapper.classes()).toContain('is-single');

		await clickRow(wrapper, 'label-1');
		expect(value.value).toBe('1');
		expect(rowOf(wrapper, 'label-1').classes()).toContain('is-checked');
		// 不展开（展开点图标）
		expect(rowOf(wrapper, 'label-1').classes()).not.toContain('is-expanded');

		await clickRow(wrapper, 'label-3');
		expect(value.value).toBe('3');
		expect(rowOf(wrapper, 'label-1').classes()).not.toContain('is-checked');

		await clickRow(wrapper, 'label-3');
		expect(value.value).toBe('3');
		expect(onCheck).toHaveBeenCalledTimes(3);
		expect(onChange).toHaveBeenCalledTimes(2);
	});

	it('1 + checkStrategy child：只有叶子可选，点父节点仍是展开', async () => {
		const value = ref<any>('');
		const wrapper = mount(() => (
			<Tree v-model={value.value} data={buildData()} max={1} checkStrategy="child" checkOnClickNode />
		));
		await clickRow(wrapper, 'label-2');
		expect(value.value).toBe('');
		expect(rowOf(wrapper, 'label-2').classes()).toContain('is-expanded');

		await clickRow(wrapper, 'label-2-1');
		expect(value.value).toBe('2-1');
	});

	it('1 + checkStrategy child + 复选框：父节点的复选框不可勾选', async () => {
		const wrapper = mount(() => (<Tree data={buildData()} max={1} checkStrategy="child" showCheckbox defaultExpandAll />));
		expect(checkboxOf(wrapper, 'label-1').classes()).toContain('is-disabled');
		expect(checkboxOf(wrapper, 'label-1-1-1').classes()).not.toContain('is-disabled');
	});

	it('大于 1：按回填的值计数，选满后未勾选（含半选）的节点不可勾选，取消后恢复', async () => {
		const value = ref<any[]>([]);
		const wrapper = mount(() => (
			<Tree v-model={value.value} data={buildData()} max={2} checkStrategy="child" showCheckbox defaultExpandAll />
		));
		await check(wrapper, 'label-2-1');
		expect(checkboxOf(wrapper, 'label-3').classes()).not.toContain('is-disabled');

		await check(wrapper, 'label-1-2');
		expect(value.value).toEqual(['1-2', '2-1']);
		expect(checkboxOf(wrapper, 'label-3').classes()).toContain('is-disabled');
		// 半选的父节点同样不可勾选；已勾选的可以取消
		expect(checkboxOf(wrapper, 'label-1').classes()).toContain('is-disabled');
		expect(checkboxOf(wrapper, 'label-2-1').classes()).not.toContain('is-disabled');

		await check(wrapper, 'label-2-1', false);
		expect(value.value).toEqual(['1-2']);
		expect(checkboxOf(wrapper, 'label-3').classes()).not.toContain('is-disabled');
	});

	it('大于 1：一次勾选会超过上限时整次撤回，不发出 change / check-change', async () => {
		const value = ref<any[]>([]);
		const onChange = vi.fn();
		const onCheckChange = vi.fn();
		const wrapper = mount(() => (
			<Tree
				v-model={value.value}
				data={buildData()}
				max={2}
				checkStrategy="child"
				showCheckbox
				defaultExpandAll
				onChange={onChange}
				onCheck-change={onCheckChange}
			/>
		));
		await check(wrapper, 'label-3');
		expect(value.value).toEqual(['3']);
		onChange.mockClear();
		onCheckChange.mockClear();

		// 分组 2 有两个叶子：勾选后为 3 项，超过上限
		await check(wrapper, 'label-2');
		expect(value.value).toEqual(['3']);
		expect(onChange).not.toHaveBeenCalled();
		expect(onCheckChange).not.toHaveBeenCalled();
		expect(wrapper.findAll('.vc-checkbox.is-checked').length).toBe(1);
		expect(wrapper.findAll('.vc-checkbox.is-indeterminate').length).toBe(0);
	});

	it('外部写入 v-model 后按新的值更新是否选满', async () => {
		const value = ref<any[]>([]);
		const wrapper = mount(() => (
			<Tree v-model={value.value} data={buildData()} max={2} checkStrategy="child" showCheckbox defaultExpandAll />
		));
		value.value = ['1-2', '3'];
		await flush();
		expect(checkboxOf(wrapper, 'label-2-1').classes()).toContain('is-disabled');
	});
});

describe('TreeSelect max', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	const isOpen = () => {
		const popover = document.querySelector('.vc-popover-wrapper') as HTMLElement | null;
		return !!popover && popover.style.display !== 'none';
	};

	// TreeSelect 用自定义标签（搜索高亮），按行内容的文字找
	const popupRow = (label: string) => [...document.querySelectorAll('.vc-tree-select__options .vc-tree-node')]
		.find(row => row.querySelector(':scope > .vc-tree-node__content')?.textContent === label) as HTMLElement;

	it('默认 1：没有复选框，点节点选中并关闭；再次打开点同一节点只关闭', async () => {
		const value = ref<any>('');
		const onChange = vi.fn();
		const wrapper = mount(() => (
			<TreeSelect v-model={value.value} data={buildData()} onChange={onChange} />
		), { attachTo: document.body });
		await flush();

		await wrapper.trigger('click');
		await flush();
		expect(isOpen()).toBe(true);
		expect(document.querySelector('.vc-tree-select__options .vc-checkbox')).toBeNull();
		expect(document.querySelector('.vc-tree-select__options .vc-tree')!.classList.contains('is-single')).toBe(true);

		popupRow('label-3').querySelector<HTMLElement>('.vc-tree-node__content')!.click();
		await flush();
		expect(value.value).toBe('3');
		expect(isOpen()).toBe(false);
		expect((wrapper.find('input').element as HTMLInputElement).value).toBe('label-3');

		await wrapper.trigger('click');
		await flush();
		expect(isOpen()).toBe(true);
		expect(popupRow('label-3').classList.contains('is-checked')).toBe(true);
		popupRow('label-3').querySelector<HTMLElement>('.vc-tree-node__content')!.click();
		await flush();
		expect(isOpen()).toBe(false);
		expect(onChange).toHaveBeenCalledTimes(1);
	});

	it('默认 1 + 级联列：没有复选框，点项选中并关闭；再次打开时展开到已选的节点', async () => {
		const value = ref<any>('');
		const wrapper = mount(() => (
			<TreeSelect v-model={value.value} data={buildData()} cascader />
		), { attachTo: document.body });
		await flush();

		await wrapper.trigger('click');
		await flush();
		expect(document.querySelector('.vc-tree-select__cascader-checkbox')).toBeNull();

		const item = (label: string) => [...document.querySelectorAll('.vc-cascader-column__item')]
			.find(el => el.querySelector('.vc-cascader-column__label')?.textContent === label) as HTMLElement;
		item('label-2').dispatchEvent(new MouseEvent('mousemove', { bubbles: true }));
		await flush();
		item('label-2-2').click();
		await flush();
		expect(value.value).toBe('2-2');
		expect(isOpen()).toBe(false);

		// 弹层关闭后内容卸载，再次打开时按已选值展开
		await wrapper.trigger('click');
		await flush();
		expect(document.querySelectorAll('.vc-cascader-column').length).toBe(2);
		expect(item('label-2-2').querySelector('.vc-tree-select__cascader-label.is-checked')).not.toBeNull();
	});

	it('大于 1：多选，选满后未勾选的节点不可勾选', async () => {
		const value = ref<any[]>(['1-2', '3']);
		const wrapper = mount(() => (
			<TreeSelect v-model={value.value} data={buildData()} max={2} checkStrategy="child" />
		), { attachTo: document.body });
		await flush();
		await wrapper.trigger('click');
		await flush();

		const checkbox = (label: string) => popupRow(label).querySelector(':scope > .vc-tree-node__content .vc-checkbox')!;
		expect(checkbox('label-3').classList.contains('is-checked')).toBe(true);
		expect(checkbox('label-2').classList.contains('is-disabled')).toBe(true);
		expect(checkbox('label-3').classList.contains('is-disabled')).toBe(false);
	});
});
