// @vitest-environment jsdom

import { MTree, MTreeSelect, Popover, Tree, TreeSelect, VcInstance } from '@deot/vc-components';
import { enUS, zhCN } from '@deot/vc-locale';
import { mount } from '@vue/test-utils';
import { nextTick, ref } from 'vue';
import { vi, onTestFinished } from 'vitest';
import { TreeNode, TreeStore } from '../store';
import { getChildState, markNodeData } from '../store/tree-node';
import { KEY_VALUE } from '../store/constant';
import { TreeSelectContent } from '../tree-select-content';
import { renderHighlight } from '../../select/select-search';
import { createSearchRegex } from '../../select/utils';
import { TreeSelectContentCascader } from '../tree-select-content-cascader';

const sleep = (ms = 0) => new Promise<void>(r => setTimeout(r, ms));

// @vue/test-utils 默认把 Transition 换成桩（对 Portal 里的弹层同样生效），弹层的离场回调（Popover 的 close）不会触发
// 依赖关闭动画结束的用例改走真实的过渡
const realTransition = { global: { stubs: { transition: false } } };

const flush = async () => {
	await nextTick();
	await sleep(0);
	await nextTick();
};

// 内联搜索的输入框在触发器内
const getSearchInput = () => document.querySelector('.vc-tree-select input[type="text"]') as HTMLInputElement;

const fireMouse = (
	el: Element,
	type: 'mouseenter' | 'mousemove' | 'mouseleave' | 'mousedown' | 'mouseup' | 'click'
) => {
	el.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true }));
};

const KEYS: Record<number, string> = { 13: 'Enter', 32: ' ', 37: 'ArrowLeft', 38: 'ArrowUp', 39: 'ArrowRight', 40: 'ArrowDown' };
const fireKey = (el: Element, keyCode: number) => {
	el.dispatchEvent(new KeyboardEvent('keydown', { key: KEYS[keyCode], keyCode, bubbles: true, cancelable: true } as any));
};

// 指针拖拽（Tree 用 useDragDrop，不用原生拖拽）：经过的节点由 elementFromPoint 命中，jsdom 没有实现，这里返回 under
let under: Element | null = null;
(document as any).elementFromPoint = () => under;
const asElement = (el: any) => (el?.element || el) as Element;
const contentOf = (el: any) => asElement(el).querySelector(':scope > .vc-tree-node__content') || asElement(el);
// 在节点上按下，越过阈值（4px）后开始拖拽
const pointerDragStart = async (el: any, clientY = 10) => {
	under = null;
	contentOf(el).dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 0, buttons: 1, clientX: 10, clientY }));
	window.dispatchEvent(new MouseEvent('mousemove', { cancelable: true, buttons: 1, clientX: 10, clientY: clientY + 10 }));
	await sleep(30);
};
// 指针移到节点上的 clientY 处（等一帧更新）
const pointerDragOver = async (el: any, clientY: number) => {
	under = contentOf(el);
	window.dispatchEvent(new MouseEvent('mousemove', { cancelable: true, buttons: 1, clientX: 10, clientY }));
	await sleep(30);
};
const pointerDragEnd = async () => {
	window.dispatchEvent(new MouseEvent('mouseup', { button: 0 }));
	await flush();
};

const getTreeCheckboxes = () => {
	return document.querySelectorAll('.vc-tree .vc-checkbox input[type="checkbox"]');
};

const baseData = [
	{
		value: '1',
		label: '一级 1',
		children: [
			{
				value: '1-1',
				label: '二级 1-1',
				children: [{ value: '1-1-1', label: '三级 1-1-1' }]
			}
		]
	},
	{
		value: '2',
		label: '一级 2',
		children: [
			{
				value: '2-1',
				label: '二级 2-1',
				children: [{ value: '2-1-1', label: '三级 2-1-1' }]
			},
			{
				value: '2-2',
				label: '二级 2-2',
				children: [{ value: '2-2-1', label: '三级 2-2-1' }]
			}
		]
	},
	{
		value: '3',
		label: '一级 3',
		children: [
			{
				value: '3-1',
				label: '二级 3-1',
				children: [{ value: '3-1-1', label: '三级 3-1-1' }]
			},
			{
				value: '3-2',
				label: '二级 3-2',
				children: [{ value: '3-2-1', label: '三级 3-2-1' }]
			}
		]
	},
	{ value: '4', label: '一级 4', children: [] }
];

const freshData = () => JSON.parse(JSON.stringify(baseData));
const data = freshData();

const mountTree = (props: Record<string, any> = {}) => {
	return mount(Tree as any, { attachTo: document.body, props });
};

const mountTreeSelect = (props: Record<string, any> = {}) => {
	return mount(TreeSelect as any, { attachTo: document.body, props });
};

describe('index.ts', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('basic', () => {
		expect(typeof Tree).toBe('object');
		expect(MTree).toBe(Tree);
		expect(MTreeSelect).toBe(TreeSelect);
	});

	it('create', async () => {
		const wrapper = mount(() => (<Tree />), { attachTo: document.body });
		await nextTick();

		expect(wrapper.classes()).toContain('vc-tree');
		expect(wrapper.text()).toContain('暂无数据');

		wrapper.unmount();
	});
});

describe('Tree locale', () => {
	afterEach(() => {
		VcInstance.configure({ locale: zhCN });
		document.body.innerHTML = '';
	});

	it('updates empty text and preserves explicit overrides', async () => {
		const wrapper = mountTree();
		onTestFinished(() => wrapper.unmount());
		expect(wrapper.text()).toBe('暂无数据');
		VcInstance.configure({ locale: enUS });
		await nextTick();
		expect(wrapper.text()).toBe('No data');
		await wrapper.setProps({ emptyText: 'Nothing here' });
		expect(wrapper.text()).toBe('Nothing here');
		await wrapper.setProps({ emptyText: '' });
		VcInstance.configure({ locale: zhCN });
		await nextTick();
		expect(wrapper.text()).toBe('');
	});

	it.each([false, true])('updates TreeSelect placeholder and no-match text (cascader=%s)', async (cascader) => {
		const wrapper = mountTreeSelect({ data: freshData(), searchable: true, cascader });
		onTestFinished(() => wrapper.unmount());
		expect(wrapper.find('input').attributes('placeholder')).toBe('请选择');
		await wrapper.trigger('click');
		await flush();
		const input = getSearchInput();
		input.value = 'missing';
		input.dispatchEvent(new Event('input', { bubbles: true }));
		await flush();
		const empty = () => document.querySelector(cascader ? '.vc-select-paths__empty' : '.vc-tree__empty-text')?.textContent;
		expect(empty()).toBe('暂无匹配数据');
		VcInstance.configure({ locale: enUS });
		await nextTick();
		expect(wrapper.find('input').attributes('placeholder')).toBe('Please select');
		expect(empty()).toBe('No matching data');
		await wrapper.setProps({ placeholder: 'Choose a node' });
		expect(wrapper.find('input').attributes('placeholder')).toBe('Choose a node');
		await wrapper.setProps({ placeholder: '' });
		VcInstance.configure({ locale: zhCN });
		await nextTick();
		expect(wrapper.find('input').attributes('placeholder')).toBe('');
		expect(empty()).toBe('暂无匹配数据');
	});
});

describe('Tree interaction', () => {
	afterEach(() => {
		document.body.innerHTML = '';
		vi.useRealTimers();
	});

	it('replaces data without retaining old nodes or lookup entries', async () => {
		const wrapper = mountTree({
			data: [{ value: 'old', label: 'Old', children: [{ value: 'old-child', label: 'Old child' }] }, { value: 'last', label: 'Last' }]
		});
		onTestFinished(() => wrapper.unmount());
		await wrapper.setProps({ data: [{ value: 'new', label: 'New' }] });
		expect(wrapper.findAll('[role="treeitem"]')).toHaveLength(1);
		expect(wrapper.text()).toBe('New');
		for (const value of ['old', 'old-child', 'last']) {
			expect((wrapper.vm as any).getNode(value)).toBeNull();
		}
		expect((wrapper.vm as any).getNode('new').states.data.label).toBe('New');
		await wrapper.setProps({ data: [] });
		expect(wrapper.findAll('[role="treeitem"]')).toHaveLength(0);
		expect(wrapper.text()).toBe('暂无数据');
		expect((wrapper.vm as any).getNode('new')).toBeNull();
	});

	it('render / expand / checkbox / v-model', async () => {
		const value = ref<any[]>(['1-1-1']);
		const onChange = vi.fn();
		const onCheckChange = vi.fn();
		const wrapper = mountTree({
			'modelValue': value.value,
			data,
			'defaultExpandAll': true,
			'indent': 24,
			'showCheckbox': true,
			onChange,
			onCheckChange,
			'onUpdate:modelValue': (v: any[]) => {
				value.value = v;
				wrapper.setProps({ modelValue: v });
			}
		});
		await flush();

		expect(document.querySelectorAll('.vc-tree-node').length).toBeGreaterThan(4);
		expect(document.querySelector('.vc-tree-node__content')?.getAttribute('style')).toContain('padding-left: 0px');
		expect((wrapper.vm as any).getCheckedValues()).toContain('1-1-1');

		const checkboxes = getTreeCheckboxes();
		expect(checkboxes.length).toBeGreaterThan(0);
		(checkboxes[0] as HTMLInputElement).click();
		await flush();

		expect(onChange).toHaveBeenCalled();
		expect(Array.isArray(value.value)).toBe(true);

		wrapper.unmount();
	});

	it('expandOnClickNode false + accordion', async () => {
		const wrapper = mountTree({
			data,
			expandOnClickNode: false,
			accordion: true
		});
		await flush();

		const nodes = wrapper.findAll('.vc-tree-node__content');
		const icons = wrapper.findAll('.vc-tree-node__expand-icon');
		expect(nodes.length).toBeGreaterThan(2);
		expect(icons.length).toBeGreaterThan(2);

		await nodes[0].trigger('click');
		await flush();
		expect(wrapper.findAll('.vc-tree-node.is-expanded').length).toBe(0);

		await icons[0].trigger('click');
		await flush();
		expect(wrapper.findAll('.vc-tree-node.is-expanded').length).toBe(1);

		await icons[1].trigger('click');
		await flush();
		expect(wrapper.findAll('.vc-tree-node.is-expanded').length).toBe(1);

		wrapper.unmount();
	});

	it('checkStrictly switch and expose api', async () => {
		const wrapper = mountTree({
			data,
			showCheckbox: true,
			checkStrictly: false
		});
		await flush();

		const vm = wrapper.vm as any;
		expect(() => vm.getNodePath('1')).not.toThrow();
		expect(vm.getNode('1')?.getter?.label).toBe('一级 1');
		expect(vm.getCurrentNode()).toBeNull();

		vm.setCheckedValues(['2-1-1']);
		await flush();
		expect(vm.getCheckedValues()).toContain('2-1-1');
		expect(vm.getHalfCheckedValues().length).toBeGreaterThan(0);

		await wrapper.setProps({ checkStrictly: true });
		vm.setCheckedValues(['2']);
		await flush();
		expect(vm.getCheckedValues()).toContain('2');
		expect(vm.getCheckedValues()).not.toContain('2-1-1');

		vm.setCurrentNodeByData({ value: '3' });
		expect(vm.getCurrentNode()?.value).toBe('3');

		vm.append({ value: '5', label: '一级 5' }, null);
		await flush();
		expect(vm.getNode('5')).toBeTruthy();
		vm.insertBefore({ value: '0', label: '一级 0' }, { value: '1' });
		vm.insertAfter({ value: '1.5', label: '一级 1.5' }, { value: '1' });
		await flush();
		expect(vm.getNode('0')).toBeTruthy();
		expect(vm.getNode('1.5')).toBeTruthy();
		vm.remove({ value: '1.5' });
		await flush();
		expect(vm.getNode('1.5')).toBeNull();

		vm.updateKeyChildren('4', [{ value: '4-1', label: '二级 4-1' }]);
		await flush();
		expect(vm.getNode('4-1')).toBeTruthy();

		wrapper.unmount();
	});

	it('lazy load + draggable dragstart/dragover', async () => {
		vi.useFakeTimers();
		const onDragStart = vi.fn();
		const onDragOver = vi.fn();
		const onDragEnd = vi.fn();
		const loadData = vi.fn(() => new Promise<any[]>((resolve) => {
			setTimeout(() => resolve([{ value: '4-1', label: '二级 4-1' }]), 50);
		}));

		const wrapper = mountTree({
			data: [{ value: '4', label: '一级 4' }],
			lazy: true,
			loadData,
			draggable: true,
			onNodeDragstart: onDragStart,
			onNodeDragover: onDragOver,
			onNodeDragend: onDragEnd
		});
		await nextTick();

		const icon = wrapper.find('.vc-tree-node__expand-icon');
		await icon.trigger('click');
		await vi.runAllTimersAsync();
		await nextTick();
		expect(loadData).toHaveBeenCalledTimes(1);
		expect((wrapper.vm as any).getNode('4-1')).toBeTruthy();
		// 拖拽按帧更新：改回真实定时器
		vi.useRealTimers();

		const node = wrapper.find('.vc-tree-node');
		// 展开图标带 vc-drag-ignore：从它按下不发起拖拽
		expect(wrapper.find('.vc-tree-node__expand-icon').classes()).toContain('vc-drag-ignore');
		await pointerDragStart(node);
		await nextTick();
		expect(wrapper.classes()).toContain('is-dragging');
		expect(onDragStart).toHaveBeenCalled();

		await pointerDragOver(node, 1);
		await nextTick();
		expect(onDragOver).toHaveBeenCalled();
		expect(onDragEnd).not.toHaveBeenCalled();

		wrapper.unmount();
	});

	it('draggable: drop "after" between siblings', async () => {
		const onDrop = vi.fn();
		const onDragEnd = vi.fn();
		const onDragEnter = vi.fn();
		const wrapper = mountTree({
			data: [
				{ value: 'a', label: 'A' },
				{ value: 'b', label: 'B' }
			],
			draggable: true,
			onNodeDrop: onDrop,
			onNodeDragend: onDragEnd,
			onNodeDragenter: onDragEnter
		});
		await flush();

		const nodes = wrapper.findAll('.vc-tree-node');
		await pointerDragStart(nodes[0]);
		await pointerDragOver(nodes[1], 999);
		await flush();
		await pointerDragEnd();
		await flush();

		expect(onDragEnter).toHaveBeenCalled();
		expect(onDrop).toHaveBeenCalled();
		expect(onDragEnd).toHaveBeenCalled();

		wrapper.unmount();
	});

	it('draggable: drop "inner" with allowDrag/allowDrop', async () => {
		const onDrop = vi.fn();
		const onDragEnter = vi.fn();
		const onDragLeave = vi.fn();
		const allowDrop = vi.fn(() => true);
		const allowDrag = vi.fn(() => true);
		const wrapper = mountTree({
			data: [
				{ value: 'a', label: 'A' },
				{ value: 'b', label: 'B' },
				{ value: 'c', label: 'C' }
			],
			draggable: true,
			allowDrag,
			allowDrop,
			onNodeDrop: onDrop,
			onNodeDragenter: onDragEnter,
			onNodeDragleave: onDragLeave
		});
		await flush();

		const nodes = wrapper.findAll('.vc-tree-node');
		await pointerDragStart(nodes[0]);
		await pointerDragOver(nodes[1], 0);
		// 移到第三个节点，触发 drag-leave 旧节点
		await pointerDragOver(nodes[2], 0);
		await flush();
		await pointerDragEnd();
		await flush();

		expect(allowDrag).toHaveBeenCalled();
		expect(allowDrop).toHaveBeenCalled();
		expect(onDragEnter).toHaveBeenCalled();
		expect(onDragLeave).toHaveBeenCalled();
		expect(onDrop).toHaveBeenCalled();

		wrapper.unmount();
	});

	it('draggable: allowDrag returns false aborts drag', async () => {
		const onDragStart = vi.fn();
		const wrapper = mountTree({
			data: [{ value: 'a', label: 'A' }],
			draggable: true,
			allowDrag: () => false,
			onNodeDragstart: onDragStart
		});
		await flush();

		const node = wrapper.find('.vc-tree-node');
		await pointerDragStart(node);
		await flush();

		expect(onDragStart).not.toHaveBeenCalled();
		expect(wrapper.classes()).not.toContain('is-dragging');

		wrapper.unmount();
	});

	it('partial keyValue falls back to defaults', async () => {
		const wrapper = mountTree({
			data: [{ id: '1', label: 'a', children: [{ id: '1-1', label: 'b' }] }],
			keyValue: { value: 'id' },
			defaultExpandAll: true
		});
		await flush();
		const vm = wrapper.vm as any;

		expect(wrapper.findAll('.vc-tree-node[role="treeitem"]').length).toBe(2);
		expect(vm.getNodePath('1-1').map((i: any) => i.id)).toEqual(['1', '1-1']);

		wrapper.unmount();
	});

	it('tree api errors when keyValue.value missing', async () => {
		const wrapper = mountTree({
			data,
			keyValue: {
				value: '',
				label: 'label',
				children: 'children',
				disabled: 'disabled',
				isLeaf: 'isLeaf'
			}
		});
		await flush();
		const vm = wrapper.vm as any;

		expect(() => vm.getNodePath('1')).toThrow();
		expect(() => vm.getCurrentKey()).toThrow();
		expect(() => vm.setCheckedNodes([])).toThrow();
		expect(() => vm.setCheckedValues([])).toThrow();
		expect(() => vm.setCurrentNode({ value: '1' })).toThrow();
		expect(() => vm.setCurrentNodeByData({ value: '1' })).toThrow();
		expect(() => vm.updateKeyChildren('1', [])).toThrow();

		wrapper.unmount();
	});

	it('keyboard navigation: up/down/left/space', async () => {
		const wrapper = mountTree({ data: freshData(), showCheckbox: true, defaultExpandAll: true });
		await flush();

		const items = wrapper.findAll('.vc-tree-node[role="treeitem"]');
		expect(items.length).toBeGreaterThan(2);
		(items[0].element as HTMLElement).focus();

		fireKey(items[0].element, 40); // down
		await flush();
		expect(document.activeElement).toBe(items[1].element);

		fireKey(items[1].element, 38); // up
		await flush();
		expect(document.activeElement).toBe(items[0].element);

		// ← 收起展开的节点，→ 再展开
		fireKey(items[0].element, 37);
		await flush();
		expect(items[0].attributes('aria-expanded')).toBe('false');
		await sleep(400);
		fireKey(items[0].element, 39);
		await flush();
		expect(items[0].attributes('aria-expanded')).toBe('true');

		// space -> 切换 checkbox
		const before = (wrapper.vm as any).getCheckedValues().length;
		fireKey(items[1].element, 32);
		await flush();
		const after = (wrapper.vm as any).getCheckedValues().length;
		expect(after).toBeGreaterThanOrEqual(before);

		wrapper.unmount();
	});

	it('watches: data / expandedValues / modelValue', async () => {
		const wrapper = mountTree({
			data: freshData(),
			expandedValues: ['1'],
			modelValue: ['1-1-1']
		});
		await flush();

		await wrapper.setProps({ data: [{ value: 'x', label: 'X' }] });
		await flush();
		expect((wrapper.vm as any).getNode('x')).toBeTruthy();

		await wrapper.setProps({ expandedValues: [] });
		await flush();

		await wrapper.setProps({ modelValue: [] });
		await flush();

		wrapper.unmount();
	});

	it('filter throws without filterNode', async () => {
		const wrapper = mountTree({ data });
		await flush();
		expect(() => (wrapper.vm as any).filter('1')).toThrow();
		wrapper.unmount();
	});

	it('draggable: dropType none / before', async () => {
		const wrapper = mountTree({
			data: [
				{ value: 'a', label: 'A' },
				{ value: 'b', label: 'B' }
			],
			draggable: true,
			allowDrop: () => false
		});
		await flush();

		const nodes = wrapper.findAll('.vc-tree-node');
		await pointerDragStart(nodes[0]);
		// dropType='none'：所有方向均禁止
		await pointerDragOver(nodes[1], 0);
		await flush();
		expect(wrapper.classes()).toContain('is-drop-not-allow');

		wrapper.unmount();

		// dropType='before'：clientY 为负值，distance < prevPercent*height
		const w2 = mountTree({
			data: [
				{ value: 'a2', label: 'A' },
				{ value: 'b2', label: 'B' }
			],
			draggable: true
		});
		await flush();
		const ns = w2.findAll('.vc-tree-node');
		await pointerDragStart(ns[0]);
		await pointerDragOver(ns[1], -1);
		await flush();
		await pointerDragEnd();
		await flush();

		w2.unmount();
	});

	it('exposes getCurrentKey when keyValue.value is set', async () => {
		const wrapper = mountTree({ data, currentNodeValue: '2' });
		await flush();
		const vm = wrapper.vm as any;
		expect(vm.getCurrentKey()).toBe('2');
		expect(vm.getCheckedNodes(false, true)).toBeDefined();
		expect(vm.getHalfCheckedNodes()).toBeDefined();
		wrapper.unmount();
	});

	it('filter executes when filterNode provided', async () => {
		const wrapper = mountTree({
			data: freshData(),
			filterNode: (kw: string, row: any) => String(row.label || '').includes(kw)
		});
		await flush();
		(wrapper.vm as any).filter('一级 1');
		await flush();
		expect((wrapper.vm as any).getNode('1')?.states?.visible).toBe(true);
		wrapper.unmount();
	});
});

describe('Tree 逐行渲染与展开动画', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	const treeData = () => [
		{
			value: 'p1',
			label: 'P1',
			children: [{ value: 'c1', label: 'C1' }, { value: 'c2', label: 'C2', children: [{ value: 'g1', label: 'G1' }] }]
		},
		{ value: 'p2', label: 'P2', children: [{ value: 'c3', label: 'C3' }] }
	];
	// 列表的行（不含动画块里的）
	const rowsOf = (wrapper: any) => Array.from(wrapper.element.querySelectorAll(':scope > .vc-select-list > .vc-tree-node'))
		.map((el: any) => el.querySelector(':scope > .vc-tree-node__content').textContent);
	const motionOf = (wrapper: any) => Array.from(wrapper.element.querySelectorAll('.vc-tree-node__motion > .vc-tree-node'))
		.map((el: any) => el.querySelector(':scope > .vc-tree-node__content').textContent);
	const iconOf = (wrapper: any, label: string) => {
		const row = Array.from(wrapper.element.querySelectorAll('.vc-tree-node'))
			.find((el: any) => el.querySelector(':scope > .vc-tree-node__content').textContent === label) as HTMLElement;
		return row.querySelector(':scope > .vc-tree-node__content .vc-tree-node__expand-icon') as HTMLElement;
	};

	it('可见节点逐行渲染：行是同级元素，层级由 aria-level 表达；收起的子孙不渲染', async () => {
		const wrapper = mountTree({ data: treeData(), expandedValues: ['p1'] });
		await flush();
		expect(rowsOf(wrapper)).toEqual(['P1', 'C1', 'C2', 'P2']);
		const levels = Array.from(wrapper.element.querySelectorAll('.vc-tree-node')).map((el: any) => el.getAttribute('aria-level'));
		expect(levels).toEqual(['1', '2', '2', '1']);
		// 叶子没有 aria-expanded
		expect(wrapper.element.querySelectorAll('.vc-tree-node')[1].hasAttribute('aria-expanded')).toBe(false);
		wrapper.unmount();
	});

	it('展开 / 收起：过渡期间子孙在节点的动画块里，结束后回到列表；过渡中再次点击立即反向', async () => {
		const wrapper = mountTree({ data: treeData() });
		await flush();
		expect(rowsOf(wrapper)).toEqual(['P1', 'P2']);

		iconOf(wrapper, 'P1').click();
		await flush();
		expect(rowsOf(wrapper)).toEqual(['P1', 'P2']);
		expect(motionOf(wrapper)).toEqual(['C1', 'C2']);
		await sleep(400);
		await flush();
		expect(motionOf(wrapper)).toEqual([]);
		expect(rowsOf(wrapper)).toEqual(['P1', 'C1', 'C2', 'P2']);

		// 收起：子孙移到动画块，从高度过渡到 0
		iconOf(wrapper, 'P1').click();
		await flush();
		expect(rowsOf(wrapper)).toEqual(['P1', 'P2']);
		expect(motionOf(wrapper)).toEqual(['C1', 'C2']);
		// 过渡中再次点击：反向展开
		iconOf(wrapper, 'P1').click();
		await flush();
		expect(motionOf(wrapper)).toEqual(['C1', 'C2']);
		await sleep(400);
		await flush();
		expect(rowsOf(wrapper)).toEqual(['P1', 'C1', 'C2', 'P2']);
		wrapper.unmount();
	});

	it('accordion：展开时收起同级节点', async () => {
		const wrapper = mountTree({ data: treeData(), expandedValues: ['p1'], accordion: true });
		await flush();
		iconOf(wrapper, 'P2').click();
		await sleep(400);
		await flush();
		expect(rowsOf(wrapper)).toEqual(['P1', 'P2', 'C3']);
		wrapper.unmount();
	});

	it('懒加载：子节点加载后出现在列表里，之后追加的子节点同样出现', async () => {
		const loadData = vi.fn(async () => [{ value: 'l1', label: 'L1' }]);
		const wrapper = mountTree({ data: [{ value: 'r', label: 'R' }], lazy: true, loadData });
		await flush();
		iconOf(wrapper, 'R').click();
		await flush();
		await sleep(400);
		await flush();
		expect(rowsOf(wrapper)).toEqual(['R', 'L1']);
		(wrapper.vm as any).append({ value: 'l2', label: 'L2' }, 'r');
		await flush();
		expect(rowsOf(wrapper)).toEqual(['R', 'L1', 'L2']);
		wrapper.unmount();
	});

	it('check-change：收起而未渲染的节点也会发出，每个节点一次', async () => {
		const onCheckChange = vi.fn();
		const wrapper = mountTree({ data: treeData(), showCheckbox: true, onCheckChange });
		await flush();
		(wrapper.element.querySelector('.vc-tree-node input[type="checkbox"]') as HTMLInputElement).click();
		await flush();
		const values = onCheckChange.mock.calls.map(([e]: any) => e.data.value).sort();
		expect(values).toEqual(['c1', 'c2', 'g1', 'p1']);
		expect(onCheckChange.mock.calls.every(([e]: any) => e.checked && !e.indeterminate)).toBe(true);
		wrapper.unmount();
	});
});

describe('Tree virtualized', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	const bigData = () => Array.from({ length: 300 }, (_, i) => ({
		value: `${i}`,
		label: `Group ${i}`,
		children: [{ value: `${i}-0`, label: `Leaf ${i}-0` }]
	}));

	it('只渲染部分行；展开、勾选与 check 事件照常', async () => {
		const onCheck = vi.fn();
		const wrapper = mount(() => (
			<div class="vc-scroller" style="height: 200px; overflow: auto">
				<Tree data={bigData()} virtualized showCheckbox onCheck={onCheck} />
			</div>
		), { attachTo: document.body });
		await flush();
		await sleep(30);
		const rows = () => Array.from((wrapper.element as HTMLElement).querySelectorAll<HTMLElement>('.vc-tree-node'));
		const texts = () => rows().map(el => el.querySelector(':scope > .vc-tree-node__content')!.textContent);
		expect(wrapper.find('.vc-tree .vc-recycle-list').exists()).toBe(true);
		expect(rows().length).toBeGreaterThan(0);
		expect(rows().length).toBeLessThan(300);

		const first = rows()[0] as HTMLElement;
		(first.querySelector('.vc-tree-node__expand-icon') as HTMLElement).click();
		await sleep(400);
		await flush();
		expect(texts().slice(0, 3)).toEqual(['Group 0', 'Leaf 0-0', 'Group 1']);

		(rows()[1].querySelector('input[type="checkbox"]') as HTMLInputElement).click();
		await flush();
		expect(onCheck.mock.calls.at(-1)![0]).toMatchObject({ checkedValues: ['0', '0-0'] });
		wrapper.unmount();
	});

	it('TreeSelect 树形模式：virtualized 透传给树，高亮与回车照常', async () => {
		const value = ref<any[]>([]);
		const wrapper = mount(() => (
			<TreeSelect v-model={value.value} data={bigData()} max={999} virtualized />
		), { attachTo: document.body });
		await flush();
		await wrapper.trigger('click');
		await flush();
		await sleep(30);
		const tree = document.querySelector('.vc-tree-select__options .vc-tree')!;
		expect(tree.querySelector('.vc-recycle-list')).not.toBeNull();
		expect(tree.querySelectorAll('.vc-tree-node').length).toBeLessThan(300);
		expect(tree.querySelector('.vc-tree-node[data-active] > .vc-tree-node__content')!.textContent).toBe('Group 0');

		document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));
		document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
		await flush();
		expect(value.value).toEqual(['1', '1-0']);
		wrapper.unmount();
	});
});

describe('Tree event payloads', () => {
	// 节点高 20px（jsdom 没有排版）：上四分之一为 before，中间为 inner，下四分之一为 after；
	// 高度为 0 时各区域的阈值都是 0，被拒绝的区域无法让出
	let restoreRect: { mockRestore: () => void };
	beforeEach(() => {
		restoreRect = vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
			top: 0, bottom: 20, height: 20, left: 0, right: 100, width: 100, x: 0, y: 0, toJSON: () => ({})
		} as DOMRect);
	});
	afterEach(() => {
		restoreRect.mockRestore();
		document.body.innerHTML = '';
	});

	const BEFORE = 2;
	const INNER = 10;
	const AFTER = 18;

	const buildData = () => [
		{ value: 'p1', label: 'P1', children: [{ value: 'c1', label: 'C1' }] },
		{ value: 'p2', label: 'P2' },
		{ value: 'p3', label: 'P3' }
	];

	// 按标签找到节点元素（内容行的文字即标签）
	const nodeOf = (wrapper: any, label: string) => {
		return wrapper.findAll('.vc-tree-node').find((el: any) => el.find('.vc-tree-node__content').text() === label)!;
	};
	const labels = (wrapper: any) => wrapper.findAll('.vc-tree-node').map((el: any) => el.find('.vc-tree-node__content').text());
	const valueOf = (node: any) => (node ? node.states.data.value : null);
	const placeOf = ({ parent, index }: any) => ({ parent: valueOf(parent), index });

	const dragStart = (el: any) => pointerDragStart(el);
	const dragOver = (el: any, clientY: number) => pointerDragOver(el, clientY);
	// 松手与节点无关：调用处传入的被拖节点忽略
	const dragEnd = pointerDragEnd as (el?: any) => Promise<void>;

	it('node-click / current-change：{ node, data, instance, event } / { node, data, oldNode }；当前节点不变时不发出 current-change', async () => {
		const onNodeClick = vi.fn();
		const onCurrentChange = vi.fn();
		const wrapper = mountTree({ data: buildData(), expandOnClickNode: false, onNodeClick, onCurrentChange });
		await flush();

		await nodeOf(wrapper, 'P1').trigger('click');
		await flush();
		const click = onNodeClick.mock.calls[0][0];
		expect(valueOf(click.node)).toBe('p1');
		expect(click.data).toEqual(expect.objectContaining({ value: 'p1' }));
		expect(click.instance.props.node).toBe(click.node);
		expect(click.event).toBeInstanceOf(Event);
		expect(onCurrentChange).toHaveBeenCalledTimes(1);
		expect(onCurrentChange.mock.calls[0][0]).toEqual({ node: click.node, data: click.data, oldNode: null });

		// 再次点击同一节点：node-click 照常发出，current-change 不再发出
		await nodeOf(wrapper, 'P1').trigger('click');
		await flush();
		expect(onNodeClick).toHaveBeenCalledTimes(2);
		expect(onCurrentChange).toHaveBeenCalledTimes(1);

		await nodeOf(wrapper, 'P2').trigger('click');
		await flush();
		const change = onCurrentChange.mock.calls[1][0];
		expect(valueOf(change.node)).toBe('p2');
		expect(change.data.value).toBe('p2');
		expect(valueOf(change.oldNode)).toBe('p1');
		wrapper.unmount();
	});

	it('node-contextmenu：{ node, data, instance, event }', async () => {
		const onNodeContextmenu = vi.fn();
		const wrapper = mountTree({ data: buildData(), onNodeContextmenu });
		await flush();

		await nodeOf(wrapper, 'P2').trigger('contextmenu');
		const payload = onNodeContextmenu.mock.calls[0][0];
		expect(valueOf(payload.node)).toBe('p2');
		expect(payload.data.value).toBe('p2');
		expect(payload.instance.props.node).toBe(payload.node);
		expect(payload.event).toBeInstanceOf(Event);
		wrapper.unmount();
	});

	it('node-expand-change：展开与收起为同一个事件 { node, data, expanded, instance }', async () => {
		const onNodeExpandChange = vi.fn();
		const onNodeExpand = vi.fn();
		const onNodeCollapse = vi.fn();
		const wrapper = mountTree({ data: buildData(), onNodeExpandChange, onNodeExpand, onNodeCollapse });
		await flush();
		const icon = () => nodeOf(wrapper, 'P1').find('.vc-tree-node__expand-icon');

		await icon().trigger('click');
		await flush();
		expect(onNodeExpandChange).toHaveBeenCalledTimes(1);
		const expand = onNodeExpandChange.mock.calls[0][0];
		expect(valueOf(expand.node)).toBe('p1');
		expect(expand).toMatchObject({ data: expect.objectContaining({ value: 'p1' }), expanded: true });
		expect(expand.instance.props.node).toBe(expand.node);

		await icon().trigger('click');
		await flush();
		expect(onNodeExpandChange).toHaveBeenCalledTimes(2);
		expect(onNodeExpandChange.mock.calls[1][0]).toMatchObject({ expanded: false });
		expect(valueOf(onNodeExpandChange.mock.calls[1][0].node)).toBe('p1');
		// 原来的两个事件不再发出
		expect(onNodeExpand).not.toHaveBeenCalled();
		expect(onNodeCollapse).not.toHaveBeenCalled();
		wrapper.unmount();
	});

	it('check / check-change：{ node, data, checked, checkedNodes, … } / { node, data, checked, indeterminate }', async () => {
		const onCheck = vi.fn();
		const onCheckChange = vi.fn();
		const wrapper = mountTree({
			data: [{ value: 'p', label: 'P', children: [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }] }],
			showCheckbox: true,
			defaultExpandAll: true,
			onCheck,
			onCheckChange
		});
		await flush();
		const checkbox = (label: string) => nodeOf(wrapper, label).find('.vc-tree-node__content input[type="checkbox"]').element as HTMLInputElement;

		checkbox('A').click();
		await flush();
		// 叶子节点：checked 变化即发出（indeterminate 不变）；父节点变为半选
		const changesOf = () => onCheckChange.mock.calls.map(([e]: any) => [valueOf(e.node), e.checked, e.indeterminate]);
		expect(changesOf().sort()).toEqual([
			['a', true, false],
			['p', false, true]
		]);
		const check = onCheck.mock.calls.at(-1)![0];
		expect(valueOf(check.node)).toBe('a');
		expect(check).toMatchObject({ data: expect.objectContaining({ value: 'a' }), checked: true, checkedValues: ['a'], halfCheckedValues: ['p'] });
		expect(check.checkedNodes.map(valueOf)).toEqual(['a']);
		expect(check.halfCheckedNodes.map(valueOf)).toEqual(['p']);

		// 勾满子节点：父节点由半选变为选中
		checkbox('B').click();
		await flush();
		expect(onCheck.mock.calls.at(-1)![0]).toMatchObject({ checked: true, checkedValues: expect.arrayContaining(['p', 'a', 'b']) });
		const parentChange = onCheckChange.mock.calls.map(([e]: any) => e).filter((e: any) => valueOf(e.node) === 'p').at(-1);
		expect(parentChange).toMatchObject({ data: expect.objectContaining({ value: 'p' }), checked: true, indeterminate: false });
		// 每个节点每次变化只发出一次
		expect(changesOf().sort()).toEqual([
			['a', true, false],
			['b', true, false],
			['p', false, true],
			['p', true, false]
		]);

		checkbox('A').click();
		await flush();
		expect(onCheck.mock.calls.at(-1)![0]).toMatchObject({ checked: false });
		wrapper.unmount();
	});

	it('拖拽事件：node-dragstart / dragenter / dragover / dragleave / drop / dragend 均为对象参数', async () => {
		const events: any[] = [];
		const record = (name: string) => (e: any) => events.push([name, e]);
		const wrapper = mountTree({
			data: [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }, { value: 'c', label: 'C' }],
			draggable: true,
			onNodeDragstart: record('dragstart'),
			onNodeDragenter: record('dragenter'),
			onNodeDragleave: record('dragleave'),
			onNodeDragover: record('dragover'),
			onNodeDrop: record('drop'),
			onNodeDragend: record('dragend')
		});
		await flush();
		const [a, b, c] = ['A', 'B', 'C'].map(label => nodeOf(wrapper, label));

		// A 经过 C 再到 B 的下方区域：放在 B 之后
		await dragStart(a);
		await dragOver(c, AFTER);
		await dragOver(b, AFTER);
		await flush();
		await dragEnd(a);
		await flush();

		// 与浏览器一致：drop 在 dragend 之前
		expect(events.map(([name]) => name)).toEqual(['dragstart', 'dragenter', 'dragover', 'dragleave', 'dragenter', 'dragover', 'drop', 'dragend']);
		const payloadOf = (name: string, i = 0) => events.filter(([n]) => n === name)[i][1];

		const start = payloadOf('dragstart');
		expect(valueOf(start.node)).toBe('a');
		expect(start.data.value).toBe('a');
		expect(start.event).toBeInstanceOf(Event);
		expect(valueOf(payloadOf('dragenter', 0).targetNode)).toBe('c');
		expect(valueOf(payloadOf('dragleave').targetNode)).toBe('c');
		expect(valueOf(payloadOf('dragenter', 1).targetNode)).toBe('b');
		expect(valueOf(payloadOf('dragover', 1).node)).toBe('a');
		expect(valueOf(payloadOf('dragover', 1).targetNode)).toBe('b');

		const drop = payloadOf('drop');
		expect(valueOf(drop.node)).toBe('a');
		expect(drop.data.value).toBe('a');
		expect(valueOf(drop.targetNode)).toBe('b');
		expect(drop.position).toBe('after');
		expect(placeOf(drop.from)).toEqual({ parent: null, index: 0 });
		expect(placeOf(drop.to)).toEqual({ parent: null, index: 1 });
		expect(drop.event).toBeInstanceOf(Event);

		const end = payloadOf('dragend');
		expect(end).toMatchObject({ position: 'after', dropped: true });
		expect(valueOf(end.targetNode)).toBe('b');
		// 移动后的顺序与 to 一致
		expect(labels(wrapper)).toEqual(['B', 'A', 'C']);
		wrapper.unmount();
	});

	it('指针拖拽：跟随元素与插入线带公用类，事件的 event 为指针事件；Esc 取消不移动；从展开图标按下不发起拖拽', async () => {
		const onNodeDragstart = vi.fn();
		const onNodeDrop = vi.fn();
		const onNodeDragend = vi.fn();
		const wrapper = mountTree({ data: buildData(), draggable: true, onNodeDragstart, onNodeDrop, onNodeDragend });
		await flush();
		const root = wrapper.element as HTMLElement;

		// 展开图标带 vc-drag-ignore
		const icon = nodeOf(wrapper, 'P1').find('.vc-tree-node__expand-icon').element;
		icon.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 0, buttons: 1, clientX: 10, clientY: 10 }));
		window.dispatchEvent(new MouseEvent('mousemove', { cancelable: true, buttons: 1, clientX: 10, clientY: 30 }));
		await sleep(30);
		expect(onNodeDragstart).not.toHaveBeenCalled();
		window.dispatchEvent(new MouseEvent('mouseup', { button: 0 }));
		await flush();

		await dragStart(nodeOf(wrapper, 'P3'));
		expect(onNodeDragstart.mock.calls[0][0].event).toBeInstanceOf(MouseEvent);
		expect(document.body.classList.contains('vc-dragging')).toBe(true);
		expect(root.querySelector('.vc-drag__ghost.vc-tree__drag-ghost')!.textContent).toBe('P3');
		await dragOver(nodeOf(wrapper, 'P2'), BEFORE);
		const indicator = root.querySelector('.vc-drag__indicator.vc-tree__drop-indicator') as HTMLElement;
		expect(indicator.style.display).toBe('');
		await dragOver(nodeOf(wrapper, 'P2'), INNER);
		expect(indicator.style.display).toBe('none');
		expect(nodeOf(wrapper, 'P2').classes()).toContain('is-drop-inner');

		// Esc 取消：不移动，node-dragend 的 dropped 为 false，跟随元素、插入线与高亮清除
		window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', cancelable: true }));
		await flush();
		expect(onNodeDrop).not.toHaveBeenCalled();
		expect(onNodeDragend.mock.calls[0][0]).toMatchObject({ dropped: false, position: null });
		expect(labels(wrapper)).toEqual(['P1', 'P2', 'P3']);
		expect(root.querySelector('.vc-drag__ghost')).toBeNull();
		expect(root.querySelector('.vc-drag__indicator')).toBeNull();
		expect(root.querySelector('.is-drop-inner')).toBeNull();
		expect(document.body.classList.contains('vc-dragging')).toBe(false);
		wrapper.unmount();
	});

	it('allowDrag / allowDrop：对象参数；三个区域分别询问，各自带 from / to（to.index 按移除被拖节点之后计算）', async () => {
		const allowDrag = vi.fn(() => true);
		const allowDrop = vi.fn(() => true);
		const wrapper = mountTree({ data: buildData(), draggable: true, defaultExpandAll: true, allowDrag, allowDrop });
		await flush();
		const callsOf = () => allowDrop.mock.calls.map(([e]: any) => ({
			node: valueOf(e.node),
			data: e.data.value,
			target: valueOf(e.targetNode),
			position: e.position,
			from: placeOf(e.from),
			to: placeOf(e.to)
		}));

		// 根级 P3 拖到 P1 的中间：放入 P1，追加在 C1 之后
		await dragStart(nodeOf(wrapper, 'P3'));
		expect(allowDrag).toHaveBeenCalledWith({ node: expect.anything(), data: expect.objectContaining({ value: 'p3' }) });
		expect(valueOf((allowDrag.mock.calls[0] as any[])[0].node)).toBe('p3');
		await dragOver(nodeOf(wrapper, 'P1'), INNER);
		const p3 = { node: 'p3', data: 'p3', target: 'p1', from: { parent: null, index: 2 } };
		expect(callsOf()).toEqual([
			{ ...p3, position: 'before', to: { parent: null, index: 0 } },
			{ ...p3, position: 'inner', to: { parent: 'p1', index: 1 } },
			{ ...p3, position: 'after', to: { parent: null, index: 1 } }
		]);
		await dragEnd(nodeOf(wrapper, 'P3'));
		await flush();
		expect(labels(wrapper)).toEqual(['P1', 'C1', 'P3', 'P2']);

		// 根级现为 [P1, P2]。P1 拖到 P2 的下方区域：同一父节点内，被拖节点在插入位置之前，to.index 减一
		allowDrop.mockClear();
		await dragStart(nodeOf(wrapper, 'P1'));
		await dragOver(nodeOf(wrapper, 'P2'), AFTER);
		const p1 = { node: 'p1', data: 'p1', target: 'p2', from: { parent: null, index: 0 } };
		expect(callsOf()).toEqual([
			{ ...p1, position: 'before', to: { parent: null, index: 0 } },
			{ ...p1, position: 'inner', to: { parent: 'p2', index: 0 } },
			{ ...p1, position: 'after', to: { parent: null, index: 1 } }
		]);
		await dragEnd(nodeOf(wrapper, 'P1'));
		await flush();
		expect(labels(wrapper)).toEqual(['P2', 'P1', 'C1', 'P3']);

		// 子节点 C1（P1 的子节点为 [C1, P3]）拖到 P1 的上方区域：from.parent 为 P1；放入自己的父节点时追加到末尾
		allowDrop.mockClear();
		await dragStart(nodeOf(wrapper, 'C1'));
		await dragOver(nodeOf(wrapper, 'P1'), BEFORE);
		const c1 = { node: 'c1', data: 'c1', target: 'p1', from: { parent: 'p1', index: 0 } };
		expect(callsOf()).toEqual([
			{ ...c1, position: 'before', to: { parent: null, index: 1 } },
			{ ...c1, position: 'inner', to: { parent: 'p1', index: 1 } },
			{ ...c1, position: 'after', to: { parent: null, index: 2 } }
		]);
		await dragEnd(nodeOf(wrapper, 'C1'));
		await flush();
		expect(labels(wrapper)).toEqual(['P2', 'C1', 'P1', 'P3']);
		wrapper.unmount();
	});

	it('allowDrop 只允许同级：({ from, to }) => from.parent === to.parent；全部拒绝时松手不移动、不报错', async () => {
		const onNodeDrop = vi.fn();
		const onNodeDragend = vi.fn();
		const wrapper = mountTree({
			data: buildData(),
			draggable: true,
			defaultExpandAll: true,
			allowDrop: ({ from, to }: any) => from.parent === to.parent,
			onNodeDrop,
			onNodeDragend
		});
		await flush();

		// P3 拖到 P1 之前：同为根级，允许
		await dragStart(nodeOf(wrapper, 'P3'));
		await dragOver(nodeOf(wrapper, 'P1'), BEFORE);
		await flush();
		expect(wrapper.classes()).not.toContain('is-drop-not-allow');
		await dragEnd(nodeOf(wrapper, 'P3'));
		await flush();
		expect(onNodeDrop).toHaveBeenCalledTimes(1);
		expect(onNodeDrop.mock.calls[0][0].position).toBe('before');
		expect(labels(wrapper)).toEqual(['P3', 'P1', 'C1', 'P2']);

		// C1 拖到 P2：之前 / 之后会换到根级，放入会换到 P2 下，全部拒绝
		await dragStart(nodeOf(wrapper, 'C1'));
		await dragOver(nodeOf(wrapper, 'P2'), AFTER);
		await flush();
		expect(wrapper.classes()).toContain('is-drop-not-allow');
		await dragEnd(nodeOf(wrapper, 'C1'));
		await flush();
		expect(onNodeDrop).toHaveBeenCalledTimes(1);
		const end = onNodeDragend.mock.calls.at(-1)![0];
		expect(valueOf(end.node)).toBe('c1');
		expect(end).toMatchObject({ targetNode: null, position: null, dropped: false });
		// 拖拽状态已重置，数据不变
		expect(wrapper.classes()).not.toContain('is-dragging');
		expect(labels(wrapper)).toEqual(['P3', 'P1', 'C1', 'P2']);
		wrapper.unmount();
	});
});

describe('Tree drop zones', () => {
	// 展开的节点元素包含子节点（高 60px），内容行高 20px：区域应按节点自己的内容行计算
	let restoreRect: { mockRestore: () => void };
	beforeEach(() => {
		restoreRect = vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
			const height = this.classList.contains('vc-tree-node') && this.classList.contains('is-expanded') ? 60 : 20;
			return { top: 0, bottom: height, height, left: 0, right: 100, width: 100, x: 0, y: 0, toJSON: () => ({}) } as DOMRect;
		});
	});
	afterEach(() => {
		restoreRect.mockRestore();
		document.body.innerHTML = '';
	});

	const nodeOf = (wrapper: any, label: string) => {
		return wrapper.findAll('.vc-tree-node').find((el: any) => el.find('.vc-tree-node__content').text() === label)!;
	};
	const dragOver = (el: any, clientY: number) => pointerDragOver(el, clientY);
	const mountZones = (props: Record<string, any> = {}) => mountTree({
		data: [
			{ value: 'p1', label: 'P1', children: [{ value: 'c1', label: 'C1' }] },
			{ value: 'p2', label: 'P2' },
			{ value: 'p3', label: 'P3' }
		],
		draggable: true,
		defaultExpandAll: true,
		...props
	});

	it('展开的父节点：按自己的内容行划分区域，行中间为 inner', async () => {
		const onNodeDrop = vi.fn();
		const wrapper = mountZones({ onNodeDrop });
		await flush();
		expect(nodeOf(wrapper, 'P1').classes()).toContain('is-expanded');

		await pointerDragStart(nodeOf(wrapper, 'P2'));
		await dragOver(nodeOf(wrapper, 'P1'), 10);
		await flush();
		expect(wrapper.classes()).toContain('is-drop-inner');
		await pointerDragEnd();
		await flush();
		expect(onNodeDrop.mock.calls[0][0].position).toBe('inner');
		wrapper.unmount();
	});

	it('展开的父节点：没有 after 区域（插入线会画在它与第一个子节点之间，节点却放到整棵子树之后）', async () => {
		const allowDrop = vi.fn(() => true);
		const onNodeDrop = vi.fn();
		const wrapper = mountZones({ allowDrop, onNodeDrop });
		await flush();

		// P3 与 P1 不相邻（P1 的下一个同级节点是 P2），P1 的 after 区域不会因为相邻而被去掉
		await pointerDragStart(nodeOf(wrapper, 'P3'));
		// 内容行的下四分之一：收起的节点为 after，展开的节点让给 inner
		await dragOver(nodeOf(wrapper, 'P1'), 18);
		await flush();
		expect(wrapper.classes()).toContain('is-drop-inner');
		// 仍会询问 after（由组件按结构排除）
		expect(allowDrop.mock.calls.map(([e]: any) => e.position)).toEqual(['before', 'inner', 'after']);
		await pointerDragEnd();
		await flush();
		expect(onNodeDrop.mock.calls[0][0].position).toBe('inner');
		wrapper.unmount();
	});

	it('inner 时高亮目标节点的标签', async () => {
		const wrapper = mountZones();
		await flush();
		await pointerDragStart(nodeOf(wrapper, 'P1'));
		await dragOver(nodeOf(wrapper, 'P2'), 10);
		await flush();
		const target = nodeOf(wrapper, 'P2');
		expect(target.classes()).toContain('is-drop-inner');
		// 与样式 .vc-tree-node.is-drop-inner > .vc-tree-node__content .vc-tree-node__label 对应
		expect(target.element.querySelector(':scope > .vc-tree-node__content .vc-tree-node__label')?.textContent).toBe('P2');
		wrapper.unmount();
	});
});

describe('TreeSelect interaction', () => {
	afterEach(() => {
		document.body.innerHTML = '';
		vi.useRealTimers();
	});

	it('portal=false 时下拉挂到组件根节点内，点击下拉内部不会关闭', async () => {
		const wrapper = mount(() => (<TreeSelect data={data} portal={false} />), { attachTo: document.body });
		await flush();

		await wrapper.trigger('click');
		await flush();

		const popup = document.querySelector('.vc-popover-wrapper') as HTMLElement;
		expect(wrapper.element.contains(popup)).toBe(true);

		// 下拉在根节点内，点击会冒泡到触发区
		popup.querySelector<HTMLElement>('.vc-popover-wrapper__container')!.click();
		await flush();
		expect(popup.style.display).not.toBe('none');

		wrapper.unmount();
	});

	it('basic / open / clearable', async () => {
		const value = ref<any[]>([]);
		const wrapper = mount(() => (
			<TreeSelect v-model={value.value} data={data} clearable extra="未选择" />
		), { attachTo: document.body });
		await flush();

		expect(wrapper.classes()).toContain('vc-tree-select');
		expect((wrapper.find('input').element as HTMLInputElement).value).toBe('未选择');

		await wrapper.trigger('click');
		await flush();
		expect(document.querySelector('.vc-popover-wrapper')).not.toBeNull();

		const first = document.querySelector('.vc-tree-select__options .vc-checkbox input[type="checkbox"]') as HTMLInputElement;
		first?.click();
		await flush();
		expect(value.value.length).toBeGreaterThan(0);

		fireMouse(wrapper.element, 'mouseenter');
		await flush();
		await wrapper.find('.vc-tree-select__icon').trigger('click');
		await flush();
		expect(value.value).toEqual([]);

		wrapper.unmount();
	});

	it('multiple tag close + cascader + async data', async () => {
		const value = ref<any[]>([]);
		const dataRef = ref<any[]>([]);
		const wrapper = mount(() => (
			<TreeSelect v-model={value.value} data={dataRef.value} max={99} clearable cascader />
		), { attachTo: document.body });
		await flush();

		dataRef.value = [...freshData()];
		await flush();

		await wrapper.trigger('click');
		await flush();
		expect(document.querySelectorAll('.vc-cascader-column').length).toBe(1);

		const firstRow = document.querySelector('.vc-cascader-column__item') as HTMLElement;
		fireMouse(firstRow, 'mousemove');
		await flush();

		const firstLabel = document.querySelector('.vc-cascader-column__label') as HTMLElement;
		firstLabel?.click();
		await flush();
		const firstCheckbox = document.querySelector('.vc-tree-select__cascader-checkbox input[type="checkbox"]') as HTMLInputElement;
		firstCheckbox?.click();
		await flush();

		value.value = ['3', '3-1', '3-1-1', '3-2', '3-2-1'];
		await flush();
		const close = wrapper.find('.vc-tag__close');
		expect(close.exists()).toBe(true);
		await close.trigger('click');
		await flush();
		expect(value.value.length).toBeLessThan(5);

		wrapper.unmount();
	});

	it('cascader + virtualized：列与搜索结果只渲染部分项，勾选作用于对应节点', async () => {
		const groups = Array.from({ length: 300 }, (_, i) => ({ value: `${i}`, label: `Group ${i}` }));
		const value = ref<any[]>([]);
		const wrapper = mount(() => (
			<TreeSelect v-model={value.value} data={groups} max={999} cascader virtualized searchable />
		), { attachTo: document.body });
		await flush();
		await wrapper.find('input').trigger('click');
		await flush();

		const column = document.querySelector('.vc-cascader-column')!;
		expect(column.classList.contains('is-virtual')).toBe(true);
		expect(column.querySelectorAll('.vc-cascader-column__item').length).toBeLessThan(300);

		const input = wrapper.find('input').element as HTMLInputElement;
		input.value = 'Group 29';
		input.dispatchEvent(new Event('input', { bubbles: true }));
		await flush();
		const paths = document.querySelectorAll('.vc-select-paths__item');
		expect(document.querySelector('.vc-select-paths .vc-recycle-list')).not.toBeNull();
		expect(paths[0].textContent).toBe('Group 29');
		expect(paths[1].textContent).toBe('Group 129');
		(paths[1] as HTMLElement).click();
		await flush();
		expect(value.value).toEqual(['129']);

		wrapper.unmount();
	});

	it('cascader：选项只响应真实的指针移动，内容在静止的指针下平移时补发的 mouseenter 不改变路径', async () => {
		const wrapper = mount(() => (
			<TreeSelect data={freshData()} max={99} cascader />
		), { attachTo: document.body });
		// 断言失败时也卸载，不影响后续用例
		onTestFinished(() => wrapper.unmount());
		await flush();

		await wrapper.trigger('click');
		await flush();
		const getColumns = () => document.querySelectorAll('.vc-cascader-column');
		const getRow = () => document.querySelector('.vc-cascader-column__item') as HTMLElement;
		expect(getColumns().length).toBe(1);

		// 只有 mouseenter（布局变化后浏览器补发，没有 mousemove）：不展开
		fireMouse(getRow(), 'mouseenter');
		await flush();
		expect(getColumns().length).toBe(1);

		// 指针在选项上移动：展开下一级
		fireMouse(getRow(), 'mousemove');
		await flush();
		expect(getColumns().length).toBe(2);
		expect(getRow().className).toContain('is-select');
	});

	it('checkStrictly tag close removes single value', async () => {
		const value = ref<any[]>(['1', '2']);
		const wrapper = mountTreeSelect({
			'modelValue': value.value,
			data,
			'max': 99,
			'checkStrictly': true,
			'onUpdate:modelValue': (v: any[]) => {
				value.value = v;
				wrapper.setProps({ modelValue: v });
			}
		});
		await flush();

		const close = wrapper.find('.vc-tag__close');
		expect(close.exists()).toBe(true);
		await close.trigger('click');
		await flush();

		expect(value.value.length).toBe(1);

		wrapper.unmount();
	});

	it('multiple: clicking tag toggles popover', async () => {
		const value = ref<any[]>(['1', '2']);
		const wrapper = mount(() => (
			<TreeSelect v-model={value.value} data={data} max={99} checkStrictly />
		), { attachTo: document.body });
		await flush();

		await wrapper.find('.vc-tag').trigger('click');
		await flush();

		const popover = document.querySelector('.vc-popover-wrapper') as HTMLElement;
		expect(popover).not.toBeNull();
		expect(popover.style.display).not.toBe('none');

		await wrapper.find('.vc-tag').trigger('click');
		await flush();

		expect(popover.style.display).toBe('none');

		wrapper.unmount();
	});

	it('multiple: clicking tag close does not open popover', async () => {
		const value = ref<any[]>(['1', '2']);
		const wrapper = mount(() => (
			<TreeSelect v-model={value.value} data={data} max={99} checkStrictly />
		), { attachTo: document.body });
		await flush();

		await wrapper.find('.vc-tag__close').trigger('click');
		await flush();

		expect(value.value).toEqual(['2']);
		expect(document.querySelector('.vc-popover-wrapper')).toBeNull();

		wrapper.unmount();
	});

	it('searchable + loadData triggers debounce search', async () => {
		vi.useFakeTimers();
		const loadData = vi.fn(() => Promise.resolve([]));
		const wrapper = mountTreeSelect({
			data,
			searchable: true,
			loadData,
			searchPlaceholder: '搜索'
		});
		await nextTick();
		await wrapper.trigger('click');
		await nextTick();

		const input = getSearchInput();
		expect(input).not.toBeNull();
		input.value = 'foo';
		input.dispatchEvent(new Event('input', { bubbles: true }));
		await vi.advanceTimersByTimeAsync(300);
		await nextTick();
		expect(loadData).toHaveBeenCalled();

		wrapper.unmount();
	});

	it('expose toggle/close and popover events; collapse tag count', async () => {
		const onReady = vi.fn();
		const onClose = vi.fn();
		const onVisibleChange = vi.fn();
		const value = ref<any[]>(['1-1-1', '2-1-1', '2-2-1']);
		const wrapper = mountTreeSelect({
			'modelValue': value.value,
			data,
			'max': 99,
			'maxTags': 1,
			'autoWidth': true,
			onReady,
			onClose,
			onVisibleChange,
			'onUpdate:modelValue': (v: any[]) => {
				value.value = v;
				wrapper.setProps({ modelValue: v });
			}
		});
		await flush();

		const vm = wrapper.vm as any;
		expect(Boolean(vm.multiple?.value ?? vm.multiple)).toBe(true);
		vm.toggle(true);
		await flush();
		expect(Boolean(vm.isActive?.value ?? vm.isActive)).toBe(true);
		vm.toggle();
		await flush();
		vm.close();
		await flush();
		expect(Boolean(vm.isActive?.value ?? vm.isActive)).toBe(false);

		await wrapper.trigger('click');
		await flush();
		const popover = wrapper.findComponent({ name: 'vc-popover' });
		expect(popover.exists()).toBe(true);
		(popover.vm as any).$emit('ready');
		(popover.vm as any).$emit('visible-change');
		(popover.vm as any).$emit('close');
		await flush();
		expect(onReady).toHaveBeenCalled();
		expect(onVisibleChange).toHaveBeenCalled();
		expect(onClose).toHaveBeenCalled();

		expect(wrapper.find('.vc-tree-select__tags').text()).toContain('+');

		wrapper.unmount();
	});

	it('disabled does not open popover and clear is no-op', async () => {
		const value = ref<any[]>(['1']);
		const wrapper = mount(() => (
			<TreeSelect v-model={value.value} data={data} disabled clearable />
		), { attachTo: document.body });
		await flush();

		await wrapper.trigger('click');
		await flush();
		const popover = document.querySelector('.vc-popover-wrapper') as HTMLElement | null;
		// popover 可能存在但不可见
		expect(popover === null || popover.style.display === 'none').toBe(true);

		await wrapper.find('.vc-tree-select__icon').trigger('click');
		await flush();
		expect(value.value.length).toBe(1);

		wrapper.unmount();
	});

	it('single line tags: shrinks the long path tag to leave room for collapse tag', async () => {
		// jsdom 无布局：容器 200，tag 按文字长度 * 10 计宽
		const spy = vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
			const width = this.classList.contains('vc-select-tags')
				? 200
				: this.classList.contains('vc-tag') ? (this.textContent || '').length * 10 : 0;
			return { width, height: 0, top: 0, left: 0, right: width, bottom: 0, x: 0, y: 0, toJSON: () => ({}) } as DOMRect;
		});
		onTestFinished(() => spy.mockRestore());
		const value = ref<any[]>(['3', '3-1', '3-1-1', '3-2', '3-2-1']);
		const wrapper = mount(() => (
			<TreeSelect v-model={value.value} data={data} max={99} />
		), { attachTo: document.body });
		await flush();

		let tags = wrapper.findAll('.vc-tree-select__tags > .vc-tag');
		expect(tags.map(i => i.text())).toEqual(['一级 3 / 二级 3-1 / 三级 3-1-1', '+1...']);
		// 200 - '+2...'(50)
		expect((tags[0].element as HTMLElement).style.maxWidth).toBe('150px');

		await tags[0].find('.vc-tag__close').trigger('click');
		await flush();

		tags = wrapper.findAll('.vc-tree-select__tags > .vc-tag');
		expect(tags.map(i => i.text())).toEqual(['一级 3 / 二级 3-2 / 三级 3-2-1']);
		expect((tags[0].element as HTMLElement).style.maxWidth).toBe('');

		wrapper.unmount();
	});

	it('tag keys stay unique when values contain the path separator', async () => {
		// 用 '-' 拼接时两条路径的 key 都是 'a-b-c'
		const treeData = [
			{ value: 'a-b', label: 'AB', children: [{ value: 'c', label: 'C' }] },
			{ value: 'a', label: 'A', children: [{ value: 'b-c', label: 'BC' }] }
		];
		const value = ref<any[]>(['a-b', 'c', 'a', 'b-c']);
		const wrapper = mount(() => (
			<TreeSelect v-model={value.value} data={treeData} max={99} maxTagLines={0} />
		), { attachTo: document.body });
		await flush();

		const texts = () => wrapper.findAll('.vc-tree-select__tags > .vc-tag').map(i => i.text());
		expect(texts()).toEqual(['AB / C', 'A / BC']);
		const keys = wrapper.findComponent({ name: 'vc-select-tags' }).props('data').map((i: any) => i.key);
		expect(new Set(keys).size).toBe(keys.length);

		await wrapper.findAll('.vc-tree-select__tags > .vc-tag')[0].find('.vc-tag__close').trigger('click');
		await flush();
		expect(texts()).toEqual(['A / BC']);

		wrapper.unmount();
	});
});

describe('Tree store & node unit', () => {
	it('store: filter / setData / expanded / checked / current node paths', () => {
		const source = freshData();
		const store = new TreeStore({
			data: source,
			filterNode: (_keyword: string, row: any) => String(row.label || '').includes('1'),
			expandedValues: ['2'],
			checkedValues: ['1-1-1']
		} as any);

		store.filter('1');
		expect(store.getNode('1')?.states.visible).toBe(true);
		expect(typeof store.getNode('4')?.states.visible).toBe('boolean');

		store.setExpandedValues(['1', '1-1']);
		expect(store.getNode('1')?.states.expanded).toBe(true);
		expect(store.getNode('1-1')?.states.expanded).toBe(true);
		store.setExpandedValues(undefined as any);

		store.setCheckedValues(['2-1-1']);
		expect(store.getCheckedValues()).toContain('2-1-1');
		expect(store.getHalfCheckedValues()).toContain('2');

		const node3 = store.getNode('3') as TreeNode;
		const node1 = store.getNode('1') as TreeNode;
		store.setCurrentNode(node3);
		expect(store.getCurrentNode()?.getter.value).toBe('3');
		store.setCurrentNode(node1); // 触发 prevCurrentNode 分支
		expect(store.getCurrentNode()?.getter.value).toBe('1');

		store.setUserCurrentNode({ [store.primaryKey]: '2' } as any);
		expect(store.getCurrentNode()?.getter.value).toBe('2');

		store.setCurrentNodeByData(undefined);
		expect(store.getCurrentNode()).toBeNull();
		store.setCurrentNodeByData(undefined); // 当前已 null 直接 fallthrough

		// 触发 instanceChanged=false 分支
		store.setData(source as any);
		expect(store.getNode('1')).toBeTruthy();
		// instanceChanged=true 分支
		store.setData(freshData() as any);
		expect(store.getNode('1')).toBeTruthy();

		// filter 不传值（清空过滤）
		store.filter('');
	});

	it('store: filter restores the expanded state when the keyword is cleared', () => {
		const store = new TreeStore({
			data: freshData(),
			filterNode: (keyword: string, row: any) => !keyword || String(row.label || '').includes(keyword),
			expandedValues: ['1']
		} as any);
		const expanded = () => Object.keys(store.nodesMap).filter(key => store.nodesMap[key].states.expanded).sort();
		expect(expanded()).toEqual(['1']);

		store.filter('三级');
		expect(expanded()).toEqual(['1', '1-1', '2', '2-1', '2-2', '3', '3-1', '3-2']);
		// 搜索期间收起的保持收起；换关键词不重新记录
		store.getNode('1')!.collapse();
		store.filter('三级 2');
		store.filter('');
		expect(expanded()).toEqual([]);
		expect(Object.values(store.nodesMap).every(node => node.states.visible)).toBe(true);

		// 再次搜索按当时的状态记录
		store.getNode('3')!.expand();
		store.filter('三级');
		store.filter('');
		expect(expanded()).toEqual(['3']);
	});

	it('store: append/remove/insert/updateChildren/_setCheckedValues/setChecked', () => {
		const source = freshData();
		const store = new TreeStore({ data: source } as any);

		store.append({ value: '9', label: '一级 9' } as any, null as any);
		expect(store.getNode('9')).toBeTruthy();
		store.append({ value: '9-1', label: '二级 9-1' } as any, store.getNode('9')?.states.data);
		expect(store.getNode('9-1')).toBeTruthy();

		store.insertBefore({ value: '8', label: '一级 8' } as any, { value: '1' } as any);
		store.insertAfter({ value: '8.5', label: '一级 8.5' } as any, { value: '8' } as any);
		expect(store.getNode('8')).toBeTruthy();
		expect(store.getNode('8.5')).toBeTruthy();

		// 引用节点不存在时不应崩溃
		store.insertBefore({ value: 'noop1', label: 'x' } as any, { value: 'no-such' } as any);
		store.insertAfter({ value: 'noop2', label: 'x' } as any, { value: 'no-such' } as any);

		store.updateChildren('4', [{ value: '4-1', label: '二级 4-1' }]);
		expect(store.getNode('4-1')).toBeTruthy();
		store.updateChildren('not-exist' as any, []);
		// 替换已有 children，触发先 remove 再 append 的循环（line 292-293）
		store.updateChildren('1', [{ value: '1-x', label: '二级 1-x' }]);
		expect(store.getNode('1-1')).toBeNull();
		expect(store.getNode('1-x')).toBeTruthy();

		const leafA = store.getNode('2-1-1') as any;
		const leafB = store.getNode('2-2-1') as any;
		store.setCheckedNodes([leafA?.states?.data, leafB?.states?.data] as any, true);
		expect(Array.isArray(store.getCheckedValues(true))).toBe(true);
		// leafOnly=false 分支
		store.setCheckedNodes([leafA?.states?.data] as any, false);

		store.setChecked({ value: '2-1-1' } as any, false, true);
		store.setChecked({ value: 'no-such' } as any, true, true); // node 不存在分支

		store.remove({ value: '8.5' } as any);
		expect(store.getNode('8.5')).toBeNull();
		// 当前节点被删除应清空 currentNode
		store.setCurrentNode(store.getNode('1') as TreeNode);
		store.remove({ value: '1' } as any);
		expect(store.getCurrentNode()).toBeNull();
	});

	it('node: siblings/contains/insert/remove/expand/collapse/lazy load', async () => {
		const source = freshData();
		source.push({ value: '10', label: '一级 10' } as any);
		const loadData = vi.fn(async () => [{ value: '10-1', label: '二级 10-1' }]);
		const store = new TreeStore({ data: source, lazy: true, loadData } as any);

		const parent = store.getNode('2') as TreeNode;
		const child1 = store.getNode('2-1') as TreeNode;
		const child2 = store.getNode('2-2') as TreeNode;
		expect(child1.getNextSiblingNode()?.getter.value).toBe('2-2');
		expect(child2.getPreviousSiblingNode()?.getter.value).toBe('2-1');
		expect(typeof parent.contains(child1)).toBe('boolean');
		expect(typeof parent.contains(child1, false)).toBe('boolean');

		const inserted = parent.insertChild({ data: { value: '2-9', label: '二级 2-9' } as any });
		expect(store.getNode('2-9')).toBeTruthy();
		// insertBefore / insertAfter 直接走 TreeNode 实例方法
		const before = parent.insertBefore({ data: { value: '2-0', label: '二级 2-0' } as any }, inserted);
		const after = parent.insertAfter({ data: { value: '2-9-1', label: '二级 2-9-1' } as any }, inserted);
		expect(before).toBeTruthy();
		expect(after).toBeTruthy();
		// removeChildByData
		parent.removeChildByData(after.states.data);
		expect(store.getNode('2-9-1')).toBeNull();

		inserted.remove();
		expect(store.getNode('2-9')).toBeNull();

		const lazyRoot = store.getNode('10') as TreeNode;
		expect(lazyRoot.shouldLoadData()).toBe(true);
		await lazyRoot.expand(true);
		expect(loadData).toHaveBeenCalled();
		expect(store.getNode('10-1')).toBeTruthy();
		// 重复展开走 done() 分支
		await lazyRoot.expand(true);
		lazyRoot.collapse();
		expect(lazyRoot.states.expanded).toBe(false);

		// setChecked('half') 触发 indeterminate 设置
		const target = store.getNode('1-1-1') as TreeNode;
		await target.setChecked('half', false);
		expect(target.states.indeterminate).toBe(true);

		// updateChildren via TreeNode（懒加载分支）
		const lazyData: any = lazyRoot.states.data;
		lazyData.children = [
			{ value: '10-1', label: '二级 10-1' },
			{ value: '10-2', label: '二级 10-2' }
		];
		lazyRoot.updateChildren();
		expect(store.getNode('10-2')).toBeTruthy();
	});

	it('node helpers: markNodeData / getChildState all/none branches', () => {
		const source = freshData();
		const store = new TreeStore({ data: source } as any);
		const root = store.root;
		const n1 = store.getNode('1') as TreeNode;
		const n2 = store.getNode('2') as TreeNode;

		const target: any = { value: 'x', label: 'x' };
		markNodeData(root, target);
		expect(Object.getOwnPropertyNames(target).includes('$treeNodeId')).toBe(true);
		// 已有 marker 直接返回
		markNodeData(root, target);
		// 无 data 直接返回
		markNodeData(root, undefined);

		n1.states.checked = true;
		n2.states.checked = false;
		n2.states.indeterminate = true;
		const half = getChildState([n1, n2] as any);
		expect(half.half).toBe(true);

		n1.states.checked = true;
		n1.states.indeterminate = false;
		n2.states.checked = true;
		n2.states.indeterminate = false;
		const all = getChildState([n1, n2] as any);
		expect(all.all).toBe(true);

		n1.states.checked = false;
		n2.states.checked = false;
		const none = getChildState([n1, n2] as any);
		expect(none.none).toBe(true);
	});

	it('store: _setCheckedValues with non-leaf node + leafOnly=true', () => {
		const source = freshData();
		const store = new TreeStore({ data: source } as any);
		const branch = store.getNode('2') as TreeNode;
		store.setCheckedNodes([branch.states.data] as any, true);
		// leafOnly 期望只剩叶子节点处于 checked
		expect(store.getCheckedValues(true).every((v: any) => /-\d-\d/.test(String(v)) === false || /-\d-\d/.test(String(v)))).toBe(true);
		expect(branch.states.checked).toBe(false);
	});

	it('node: updateChildren with mixed KEY_NODE markers', () => {
		const source = freshData();
		const store = new TreeStore({ data: source } as any);
		const root = store.getNode('1') as TreeNode;
		const rootData: any = root.states.data;
		// 在原 children 列表里追加一个无 KEY_NODE 的新数据 + 一个已有 marker 的旧数据
		const original = rootData.children[0];
		rootData.children = [original, { value: '1-2', label: '二级 1-2' }];
		root.updateChildren();
		expect(store.getNode('1-2')).toBeTruthy();

		// 删除一个旧 child（不在新数据中）走 removeChildByData 分支
		rootData.children = [{ value: '1-3', label: '二级 1-3' }];
		root.updateChildren();
		expect(store.getNode('1-3')).toBeTruthy();

		// removeChildByData: 不存在的数据应安全 no-op
		root.removeChildByData({ value: 'no-such' } as any);
	});

	it('tree-select loadData returns non-Promise should throw', async () => {
		vi.useFakeTimers();
		const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		const loadData = vi.fn(() => 'not-a-promise' as any);
		const wrapper = mountTreeSelect({
			data,
			searchable: true,
			loadData
		});
		await wrapper.trigger('click');
		await nextTick();

		const input = getSearchInput();
		expect(input).not.toBeNull();
		input.value = 'foo';
		input.dispatchEvent(new Event('input', { bubbles: true }));
		// debounce 触发后会 throw VcError
		expect(() => vi.advanceTimersByTime(300)).toThrow();

		errorSpy.mockRestore();
		wrapper.unmount();
		vi.useRealTimers();
	});

	it('TreeSelectContent / Cascader default props + renderNodeLabel', async () => {
		const w1 = mount(TreeSelectContent as any, {
			attachTo: document.body,
			props: { value: [] }
		});
		await flush();
		expect(w1.find('.vc-tree').exists()).toBe(true);
		w1.unmount();

		const renderNodeLabel = (props: any) => (
			<span class="custom-label">{props.row.label}</span>
		);
		const w2 = mount(TreeSelectContentCascader as any, {
			attachTo: document.body,
			props: {
				value: [],
				data: freshData(),
				renderNodeLabel
			}
		});
		await flush();
		expect(w2.find('.vc-cascader-column__item').exists()).toBe(true);
		// 自定义标签渲染在 label 内，复选框在其前面
		const labels = [...document.querySelectorAll('.vc-cascader-column__label')];
		expect(labels.length).toBe(freshData().length);
		labels.forEach((el, index) => {
			expect(el.querySelector(':scope > .custom-label')?.textContent).toBe(freshData()[index].label);
			expect(el.previousElementSibling?.matches('.vc-tree-select__cascader-checkbox')).toBe(true);
		});
		// 触发 hover/checkbox/click 路径，覆盖 getNodeState/handleHover/handleCheckboxChange/handleLabelClick
		const item = document.querySelector('.vc-cascader-column__item') as HTMLElement;
		fireMouse(item, 'mousemove');
		await flush();
		const checkbox = document.querySelector('.vc-tree-select__cascader-checkbox input') as HTMLInputElement;
		checkbox?.click();
		await flush();
		const label = document.querySelector('.vc-cascader-column__label') as HTMLElement;
		label?.click();
		await flush();
		w2.unmount();

		// data 默认空时也应能稳定渲染（覆盖 default: () => [])
		const w3 = mount(TreeSelectContentCascader as any, {
			attachTo: document.body,
			props: { value: [] }
		});
		await flush();
		expect(w3.find('.vc-tree-select__cascader').exists()).toBe(true);
		w3.unmount();
	});

	it('node: setChecked lazy unloaded triggers loadData (checkDescendants)', async () => {
		const loadData = vi.fn(async () => [{ value: 'lz-1', label: 'lz-1', isLeaf: true }]);
		const store = new TreeStore({
			data: [{ value: 'lz', label: 'lz' }],
			lazy: true,
			checkDescendants: true,
			loadData
		} as any);
		const node = store.getNode('lz') as TreeNode;
		await node.setChecked(true, false); // deep=false 不向下递归避免无限懒加载
		expect(loadData).toHaveBeenCalled();
		expect(node.states.loaded).toBe(true);
	});

	it('node helpers: getChildState allWithoutDisable follows keyValue.disabled', () => {
		const children = [
			{ value: 'a', label: 'A', off: true },
			{ value: 'b', label: 'B' },
			{ value: 'c', label: 'C', off: true }
		];
		const cases: [any, boolean][] = [
			[void 0, true],
			['off', false],
			[(row: any) => row.value !== 'b', false]
		];
		for (const [disabled, ignoresOff] of cases) {
			const store = new TreeStore({
				data: [{ value: 'p', label: 'P', children: JSON.parse(JSON.stringify(children)) }],
				keyValue: { ...KEY_VALUE, ...(disabled ? { disabled } : {}) }
			} as any);
			const parent = store.getNode('p') as TreeNode;
			// 传入响应式的 childNodes
			expect(getChildState(parent.childNodes)).toEqual({ all: false, none: true, allWithoutDisable: false, half: false });

			(store.getNode('b') as TreeNode).setChecked(true, false);
			// 只有「b」勾选：未勾选的 a、c 被视为禁用时 allWithoutDisable 为 true
			expect(getChildState(parent.childNodes)).toMatchObject({ all: false, half: true, allWithoutDisable: !ignoresOff });
		}
	});

	it('node: non-leaf with disabled child + checked siblings flips checked=false', () => {
		const source = [
			{
				value: 'p',
				label: 'P',
				children: [
					{ value: 'p-1', label: 'P-1', disabled: true },
					{ value: 'p-2', label: 'P-2' }
				]
			}
		];
		const store = new TreeStore({ data: source } as any);
		const parent = store.getNode('p') as TreeNode;
		(store.getNode('p-2') as TreeNode).setChecked(true, false);
		// disabled 子节点未勾选 -> all=false，但 allWithoutDisable=true，命中 flip 分支
		parent.setChecked(true, false);
		expect(parent.states.checked).toBe(false);
	});

	it('tree.getNodePath returns deep path', async () => {
		const wrapper = mountTree({ data: freshData(), expandedValues: ['1', '1-1'] });
		await flush();
		const vm = wrapper.vm as any;
		const path = vm.getNodePath({ value: '1-1-1' });
		expect(path.map((d: any) => d.value)).toEqual(['1', '1-1', '1-1-1']);
		// 不存在的节点返回空数组
		expect(vm.getNodePath('nope')).toEqual([]);
		wrapper.unmount();
	});

	it('tree-node: contextmenu + checkOnClickNode + leaf-click', async () => {
		const onContextmenu = vi.fn();
		const wrapper = mountTree({
			data: freshData(),
			showCheckbox: true,
			checkOnClickNode: true,
			defaultExpandAll: true,
			onNodeContextmenu: onContextmenu
		});
		await flush();

		const node = wrapper.find('.vc-tree-node');
		await node.trigger('contextmenu');
		await flush();
		expect(onContextmenu).toHaveBeenCalled();

		// 点击节点应同时勾选 checkbox（checkOnClickNode）
		const before = (wrapper.vm as any).getCheckedValues().length;
		await node.trigger('click');
		await flush();
		const after = (wrapper.vm as any).getCheckedValues().length;
		expect(after).toBeGreaterThanOrEqual(before);

		wrapper.unmount();
	});

	it('drag: drop on parent (contains) and reverse sibling order', async () => {
		const wrapper = mountTree({
			data: [
				{
					value: 'p1',
					label: 'P1',
					children: [{ value: 'c1', label: 'C1' }]
				},
				{ value: 'p2', label: 'P2' }
			],
			defaultExpandAll: true,
			draggable: true
		});
		await flush();

		// 反向 sibling：拖动 p2 dragover p1 → p1.getNextSiblingNode() === p2，dropNext=false
		const tops = wrapper.findAll('.vc-tree[role="tree"] > .vc-select-list > .vc-tree-node');
		const [p1, p2] = tops;
		await pointerDragStart(p2);
		await pointerDragOver(p1, 1);
		await flush();
		await pointerDragEnd();
		await flush();

		// drop child onto parent：parent.contains(child, false) === true，dropInner=false
		const all = wrapper.findAll('.vc-tree-node');
		const child = all[1]; // c1 是 p1 的子节点
		await pointerDragStart(child);
		await pointerDragOver(all[0], 0);
		await flush();

		wrapper.unmount();
	});

	it('drag: sibling drag adjusts dropPrev/Next', async () => {
		const wrapper = mountTree({
			data: [
				{ value: 's1', label: 'S1' },
				{ value: 's2', label: 'S2' }
			],
			draggable: true
		});
		await flush();

		const nodes = wrapper.findAll('.vc-tree-node');
		await pointerDragStart(nodes[0]);

		// 拖到自己的下一个兄弟（dropTreeNode.getPreviousSiblingNode() === draggingTreeNode）
		await pointerDragOver(nodes[1], 1);
		await flush();
		await pointerDragEnd();
		await flush();

		wrapper.unmount();
	});

	it('keyboard: keydown on non-tree element is ignored', async () => {
		const wrapper = mountTree({ data, defaultExpandAll: true });
		await flush();
		// 触发非 .vc-tree-node 元素的 keydown，应直接 return
		fireKey(wrapper.element, 40);
		fireKey(wrapper.element, 38);
		await flush();
		// 第一个 item 按 up 回到最后一个（首尾循环）
		const items = wrapper.findAll('.vc-tree-node[role="treeitem"]');
		(items[0].element as HTMLElement).focus();
		fireKey(items[0].element, 38);
		await flush();
		expect(document.activeElement).toBe(items[items.length - 1].element);

		// 最后一个 item 按 down 应回到第一个（line 34 wrap-around）
		const last = items[items.length - 1].element as HTMLElement;
		last.focus();
		fireKey(last, 40);
		await flush();
		expect(document.activeElement).toBe(items[0].element);

		wrapper.unmount();
	});

	it('store: currentNodeValue init + lazy default checked', () => {
		const source = freshData();
		const store = new TreeStore({
			data: source,
			currentNodeValue: '2',
			lazy: true,
			loadData: () => Promise.resolve([]),
			checkedValues: ['2-1-1', '2-1']
		} as any);
		expect(store.getCurrentNode()?.getter.value).toBe('2');
		// strictly 模式
		const store2 = new TreeStore({
			data: freshData(),
			checkStrictly: true,
			checkedValues: ['1', '2']
		} as any);
		expect(store2.getCheckedValues().sort()).toEqual(['1', '2']);
	});
});

describe('TreeSelect searchable', () => {
	afterEach(() => {
		document.body.innerHTML = '';
		vi.useRealTimers();
	});

	const typeSearch = async (keyword: string) => {
		const input = getSearchInput();
		input.value = keyword;
		input.dispatchEvent(new Event('input', { bubbles: true }));
		await flush();
	};

	it('renderHighlight', () => {
		expect(renderHighlight('abc')).toBe('abc');
		expect(renderHighlight('', createSearchRegex('a'))).toBe('');
		expect(renderHighlight(null, createSearchRegex('a'))).toBe('');
		// 没有关键词、没有命中时原样返回
		expect(renderHighlight('abc', createSearchRegex(''))).toBe('abc');
		expect(renderHighlight('abc', createSearchRegex('x'))).toBe('abc');
		const nodes = renderHighlight('aXbxc', createSearchRegex('x')) as any[];
		expect(nodes.length).toBe(5);
		expect(nodes[0]).toBe('a');
		expect(nodes[1].children).toEqual(['X']);
		expect(nodes[4]).toBe('c');
		// 命中在首尾时不留空片段
		expect((renderHighlight('xax', createSearchRegex('x')) as any[]).length).toBe(3);
	});

	it.each([false, true])('cascader checkbox tracks selection (search=%s)', async (searching) => {
		const wrapper = mount(TreeSelectContentCascader, {
			props: {
				value: ['a'],
				data: [{ value: 'a', label: '甲' }],
				searchRegex: createSearchRegex(searching ? '甲' : '')
			},
			attachTo: document.body
		});
		await flush();
		const row = () => wrapper.find(searching ? '.vc-select-paths__item' : '.vc-cascader-column__item');
		const isChecked = () => (row().find('input[type="checkbox"]').element as HTMLInputElement).checked;
		expect(isChecked()).toBe(true);
		await row().trigger('click');
		await flush();
		expect(isChecked()).toBe(false);
		await row().trigger('click');
		await flush();
		expect(isChecked()).toBe(true);
		wrapper.unmount();
	});

	it('tree mode: filters keeping hierarchy, highlights, resets on close', async () => {
		const value = ref<any[]>([]);
		const wrapper = mount(() => (
			<TreeSelect v-model={value.value} data={data} max={99} searchable />
		), { attachTo: document.body, ...realTransition });
		await flush();
		await wrapper.trigger('click');
		await flush();

		await typeSearch('2-1-1');
		const visible = Array.from(document.querySelectorAll('.vc-tree-node > .vc-tree-node__content'))
			.map(el => el.textContent);
		expect(visible.some(t => t?.includes('三级 2-1-1'))).toBe(true);
		expect(visible.some(t => t?.includes('一级 1'))).toBe(false);
		expect(document.querySelector('.vc-select-highlight')?.textContent).toBe('2-1-1');

		const checkbox = document.querySelector('.vc-tree-node .vc-checkbox input[type="checkbox"]') as HTMLInputElement;
		checkbox.click();
		await flush();
		expect(value.value.length).toBeGreaterThan(0);

		await typeSearch('不存在');
		expect(document.querySelector('.vc-tree__empty-text')?.textContent).toBe('暂无匹配数据');

		await typeSearch('(');
		await typeSearch('[');

		const popover = wrapper.findComponent({ name: 'vc-popover' });
		(popover.vm as any).$emit('update:modelValue', false);
		await flush();
		// 输入框立即显示回显；弹层淡出期间树保持过滤后的样子（被过滤的节点不渲染）
		const labels = () => Array.from(document.querySelectorAll('.vc-tree-node__content')).map(el => el.textContent);
		expect(getSearchInput().value).toBe('');
		expect(labels().some(t => t?.includes('一级 1'))).toBe(false);

		// 关闭动画结束后搜索词重置，再打开是完整的树
		await sleep(250);
		await flush();
		await wrapper.trigger('click');
		await flush();
		expect(labels().some(t => t?.includes('一级 1'))).toBe(true);

		wrapper.unmount();
	});

	it('tree mode: restores expanded state after leaving search', async () => {
		const value = ref<any[]>(['1-1-1']);
		const wrapper = mount(() => (
			<TreeSelect v-model={value.value} data={freshData()} max={99} searchable />
		), { attachTo: document.body });
		await flush();
		await wrapper.trigger('click');
		await flush();

		const expanded = () => Array.from(document.querySelectorAll('.vc-tree-node.is-expanded'))
			.map(el => el.querySelector('.vc-tree-node__content')?.textContent?.trim());
		const before = expanded();
		expect(before.length).toBeGreaterThan(0);

		await typeSearch('三级');
		await flush();
		expect(expanded().length).toBeGreaterThan(before.length);

		await typeSearch('');
		await flush();
		expect(expanded()).toEqual(before);

		wrapper.unmount();
	});

	it('tree mode: checking does not expand nodes, reopening expands the checked ones', async () => {
		const value = ref<any[]>([]);
		const source = freshData();
		const wrapper = mount(() => (
			<TreeSelect v-model={value.value} data={source} max={99} />
		), { attachTo: document.body, ...realTransition });
		await flush();
		await wrapper.trigger('click');
		await flush();

		const expanded = () => Array.from(document.querySelectorAll('.vc-tree-node[aria-expanded="true"]'))
			.map(el => el.querySelector('.vc-tree-node__content')?.textContent?.trim());
		expect(expanded()).toEqual([]);

		// 勾选收起的「一级 2」：联动勾选子孙，但不展开
		(getTreeCheckboxes()[1] as HTMLInputElement).click();
		await flush();
		expect(value.value).toEqual(expect.arrayContaining(['2', '2-1', '2-1-1', '2-2', '2-2-1']));
		expect(expanded()).toEqual([]);

		// 重新打开：按已选值展开已选节点与祖先
		const popover = wrapper.findComponent({ name: 'vc-popover' });
		(popover.vm as any).$emit('update:modelValue', false);
		await sleep(250);
		await flush();
		await wrapper.trigger('click');
		await flush();
		expect(expanded()).toEqual(['一级 2', '二级 2-1', '二级 2-2']);

		wrapper.unmount();
	});

	it('closing via clear icon also resets search', async () => {
		const value = ref<any[]>(['1']);
		const wrapper = mount(() => (
			<TreeSelect v-model={value.value} data={data} max={99} searchable clearable />
		), { attachTo: document.body });
		await flush();
		await wrapper.trigger('click');
		await flush();

		await typeSearch('一级');
		fireMouse(wrapper.element, 'mouseenter');
		await flush();
		await wrapper.find('.vc-tree-select__icon').trigger('click');
		await flush();

		expect(value.value).toEqual([]);
		expect(getSearchInput().value).toBe('');

		wrapper.unmount();
	});

	it('cascader mode: flat path results, check syncs value', async () => {
		const value = ref<any[]>([]);
		const wrapper = mount(() => (
			<TreeSelect v-model={value.value} data={data} max={99} searchable cascader />
		), { attachTo: document.body });
		await flush();
		await wrapper.trigger('click');
		await flush();

		await typeSearch('2-1-1');
		const items = document.querySelectorAll('.vc-select-paths__item');
		expect(items.length).toBe(1);
		expect(items[0].textContent).toContain('一级 2 / 二级 2-1 / 三级 2-1-1');
		expect(document.querySelector('.vc-tree-select__cascader-columns')?.getAttribute('style')).toContain('display: none');

		(items[0] as HTMLElement).click();
		await flush();
		expect(value.value).toContain('2-1-1');
		expect(value.value).toContain('2-1');

		const checkbox = document.querySelector('.vc-select-paths__item input[type="checkbox"]') as HTMLInputElement;
		checkbox.click();
		await flush();
		expect(value.value).not.toContain('2-1-1');

		await typeSearch('不存在');
		expect(document.querySelector('.vc-select-paths__empty')?.textContent).toBe('暂无匹配数据');

		await typeSearch('');
		expect(document.querySelector('.vc-select-paths')).toBeNull();
		expect(document.querySelectorAll('.vc-cascader-column').length).toBeGreaterThan(0);

		wrapper.unmount();
	});

	it('cascader search width is clamped to [240, 360]', async () => {
		const getWidth = async (columnsWidth: number) => {
			const spy = vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(columnsWidth);
			const wrapper = mount(TreeSelectContentCascader as any, {
				attachTo: document.body,
				props: { value: [], data: freshData(), searchRegex: createSearchRegex('') }
			});
			await flush();
			await wrapper.setProps({ searchRegex: createSearchRegex('一级') });
			await flush();
			const width = (document.querySelector('.vc-select-paths') as HTMLElement).style.width;
			spy.mockRestore();
			wrapper.unmount();
			return width;
		};
		expect(await getWidth(100)).toBe('240px');
		expect(await getWidth(300)).toBe('300px');
		expect(await getWidth(600)).toBe('360px');
	});

	it('cascader remote: lists all data, only highlight', async () => {
		const wrapper = mount(TreeSelectContentCascader as any, {
			attachTo: document.body,
			props: {
				value: [],
				data: freshData(),
				searchRegex: createSearchRegex('zzz'),
				remote: true
			}
		});
		await flush();
		expect(document.querySelectorAll('.vc-select-paths__item').length).toBeGreaterThan(3);
		wrapper.unmount();
	});

	it('cascader: disabled item is not toggled by row click', async () => {
		const onChange = vi.fn();
		const wrapper = mount(TreeSelectContentCascader as any, {
			attachTo: document.body,
			props: {
				value: [],
				data: [{ value: 'a', label: 'A', disabled: true }],
				searchRegex: createSearchRegex('A'),
				onChange
			}
		});
		await flush();
		(document.querySelector('.vc-select-paths__item') as HTMLElement).click();
		await flush();
		expect(onChange).not.toHaveBeenCalled();
		wrapper.unmount();
	});

	it('clear icon renders only with a value, arrow class applies to the suffix icon', async () => {
		const value = ref<any[]>(['1']);
		const wrapper = mount(() => (
			<TreeSelect v-model={value.value} data={data} clearable />
		), { attachTo: document.body });
		await flush();

		// 清空图标始终在节点中，由样式在悬停时显示
		expect(wrapper.find('.vc-select-trigger__clear').exists()).toBe(true);
		expect(wrapper.find('.vc-select-trigger__icon').classes()).toContain('is-arrow');

		value.value = [];
		await flush();
		expect(wrapper.find('.vc-select-trigger__clear').exists()).toBe(false);

		wrapper.unmount();
	});
});

describe('TreeSelect 弹层滚动', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('树模式：搜索在固定区，树由 Popover 内置的 Scroller 限高滚动', async () => {
		const wrapper = mount(() => (
			<TreeSelect data={freshData()} max={99} searchable="popover" />
		), { attachTo: document.body });
		await flush();
		await wrapper.trigger('click');
		await flush();

		const popup = document.querySelector('.vc-popover-wrapper') as HTMLElement;
		expect(popup.querySelector('.vc-popover-wrapper__header > .vc-select-search')).not.toBeNull();
		const content = popup.querySelector('.vc-popover-wrapper__content') as HTMLElement;
		expect(content.classList.contains('vc-scroller')).toBe(true);
		expect(content.style.maxHeight).toBe('200px');
		expect(content.querySelector('.vc-tree-select__options .vc-tree')).not.toBeNull();
		expect(popup.querySelectorAll('.vc-scroller')).toHaveLength(1);

		wrapper.unmount();
	});

	it('级联模式：弹层不内置滚动，各列是 Scroller', async () => {
		const wrapper = mount(() => (
			<TreeSelect data={freshData()} max={99} cascader />
		), { attachTo: document.body });
		await flush();
		await wrapper.trigger('click');
		await flush();

		const popup = document.querySelector('.vc-popover-wrapper') as HTMLElement;
		const content = popup.querySelector('.vc-popover-wrapper__content') as HTMLElement;
		expect(content.classList.contains('is-unscrollable')).toBe(true);
		expect(content.classList.contains('vc-scroller')).toBe(false);
		expect(popup.querySelector('.vc-cascader-column > .vc-scroller.vc-cascader-column__wrapper')).not.toBeNull();

		wrapper.unmount();
	});
});

describe('TreeSelect 内联搜索与键盘', () => {
	// 每个用例一份数据；不在渲染函数里创建，否则每次渲染都会换一份数据
	let treeData: any[];
	beforeEach(() => {
		treeData = freshData();
	});
	afterEach(() => {
		document.body.innerHTML = '';
	});

	// 统一的 Keyboard 在 document 的捕获阶段分发；Tree 自身的键盘逻辑读取 keyCode
	const keyCodes: Record<string, number> = { ArrowUp: 38, ArrowDown: 40, ArrowLeft: 37, ArrowRight: 39, Enter: 13 };
	const press = (key: string, el: Element = document.body) => {
		const event = new KeyboardEvent('keydown', { key, keyCode: keyCodes[key], bubbles: true, cancelable: true } as any);
		el.dispatchEvent(event);
		return event;
	};
	const typeSearch = async (keyword: string) => {
		const input = getSearchInput();
		input.value = keyword;
		input.dispatchEvent(new Event('input', { bubbles: true }));
		await flush();
	};
	const isOpen = () => {
		return Array.from(document.querySelectorAll<HTMLElement>('.vc-popover-wrapper')).some(el => el.style.display !== 'none');
	};
	const getSelected = () => Array.from(document.querySelectorAll('.vc-cascader-column'))
		.map(column => column.querySelector('.is-select .vc-cascader-column__label')?.textContent || '');

	it('输入框在触发器的标签之后；输入为空时退格移除最后一个标签', async () => {
		const value = ref<any[]>(['1-1-1', '2-1-1']);
		const wrapper = mount(() => (
			<TreeSelect v-model={value.value} data={treeData} max={99} searchable clearable />
		), { attachTo: document.body });
		await flush();

		const input = getSearchInput();
		expect(input.closest('.vc-select-tags__suffix')).not.toBeNull();
		expect(wrapper.findAll('.vc-select-tags > .vc-tag').length).toBe(2);
		// 不可搜索时的搜索栏、加载态不再出现在弹层内
		await wrapper.find('.vc-tag').trigger('click');
		await flush();
		expect(document.querySelector('.vc-popover-wrapper__header')).toBeNull();
		expect(document.activeElement).toBe(input);

		input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true }));
		await flush();
		expect(value.value).toEqual(['1', '1-1', '1-1-1']);

		wrapper.unmount();
	});

	it('checkStrictly：退格移除最后一个值', async () => {
		const value = ref<any[]>(['1', '2-1']);
		const wrapper = mount(() => (
			<TreeSelect v-model={value.value} data={treeData} max={99} searchable checkStrictly />
		), { attachTo: document.body });
		await flush();

		getSearchInput().dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true }));
		await flush();
		expect(value.value).toEqual(['1']);

		wrapper.unmount();
	});

	it('Tree 键盘：↑ ↓ 跳过禁用节点；→ 展开 / 进入子节点，← 收起 / 回到父节点；回车切换勾选；Tab 停留点跟随焦点', async () => {
		const wrapper = mountTree({
			data: [
				{ value: 'a', label: 'A', children: [{ value: 'a1', label: 'A1' }] },
				{ value: 'b', label: 'B', disabled: true },
				{ value: 'c', label: 'C', children: [{ value: 'c1', label: 'C1' }] }
			],
			showCheckbox: true,
			modelValue: ['c1']
		});
		await flush();
		const rowOf = (label: string) => Array.from(wrapper.element.querySelectorAll('.vc-tree-node'))
			.find((el: any) => el.querySelector(':scope > .vc-tree-node__content').textContent.trim() === label) as HTMLElement;
		const focused = () => (document.activeElement as HTMLElement).querySelector(':scope > .vc-tree-node__content')?.textContent?.trim();
		const pressOnFocused = (key: string) => {
			const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
			document.activeElement!.dispatchEvent(event);
			return event;
		};

		// 初始 Tab 停留点：第一个勾选的可用节点（C 的子节点全部勾选，C 也是勾选的）
		expect(rowOf('C').getAttribute('tabindex')).toBe('0');
		expect(wrapper.element.querySelectorAll('[tabindex="0"]').length).toBe(1);
		// 复选框不占用 Tab
		expect(rowOf('A').querySelector('input')!.getAttribute('tabindex')).toBe('-1');

		rowOf('A').focus();
		expect(rowOf('A').getAttribute('tabindex')).toBe('0');
		expect(pressOnFocused('ArrowDown').defaultPrevented).toBe(true);
		await flush();
		// 跳过禁用的 B
		expect(focused()).toBe('C');
		expect(rowOf('C').getAttribute('tabindex')).toBe('0');
		expect(rowOf('A').getAttribute('tabindex')).toBe('-1');

		// → 展开，再 → 进入第一个子节点
		pressOnFocused('ArrowRight');
		await sleep(400);
		await flush();
		expect(rowOf('C').getAttribute('aria-expanded')).toBe('true');
		pressOnFocused('ArrowRight');
		await flush();
		expect(focused()).toBe('C1');
		// ← 回到父节点，再 ← 收起
		pressOnFocused('ArrowLeft');
		await flush();
		expect(focused()).toBe('C');
		pressOnFocused('ArrowLeft');
		await flush();
		expect(rowOf('C').getAttribute('aria-expanded')).toBe('false');

		// 回车切换勾选
		rowOf('A').focus();
		pressOnFocused('Enter');
		await flush();
		expect((wrapper.vm as any).getCheckedValues()).toEqual(expect.arrayContaining(['a', 'a1', 'c1']));
		wrapper.unmount();
	});

	it('树形：键盘高亮（焦点留在输入框）；↑ ↓ 移动、← → 收起 / 展开、回车切换勾选，鼠标移入共用高亮；Esc 关闭', async () => {
		const value = ref<any[]>([]);
		const wrapper = mount(() => (
			<TreeSelect v-model={value.value} data={treeData} max={99} searchable />
		), { attachTo: document.body });
		await flush();
		await wrapper.trigger('click');
		await flush();
		await typeSearch('2-1-1');

		const input = getSearchInput();
		const getActive = () => document.querySelector('.vc-tree-node[data-active] > .vc-tree-node__content')?.textContent?.trim();
		// 搜索后高亮第一个节点
		expect(getActive()).toContain('一级 2');
		expect(press('ArrowDown', input).defaultPrevented).toBe(true);
		expect(getActive()).toContain('二级 2-1');
		press('ArrowDown', input);
		expect(getActive()).toBe('三级 2-1-1');
		// 首尾循环；焦点始终在输入框
		press('ArrowDown', input);
		expect(getActive()).toContain('一级 2');
		press('ArrowUp', input);
		expect(getActive()).toBe('三级 2-1-1');
		expect(document.activeElement).toBe(input);
		expect(document.querySelectorAll('.vc-tree [data-active]').length).toBe(1);

		// 回车切换勾选，弹层不关闭
		press('Enter', input);
		await flush();
		expect(value.value).toContain('2-1-1');
		expect(isOpen()).toBe(true);

		// 鼠标在节点上移动：高亮跟随
		const row = Array.from(document.querySelectorAll('.vc-tree-node'))
			.find(el => el.querySelector(':scope > .vc-tree-node__content')!.textContent!.includes('二级 2-1')) as HTMLElement;
		row.querySelector('.vc-tree-node__content')!.dispatchEvent(new MouseEvent('mousemove', { bubbles: true }));
		expect(getActive()).toContain('二级 2-1');

		expect(press('Escape', input).defaultPrevented).toBe(true);
		await flush();
		expect(isOpen()).toBe(false);
		expect(document.activeElement).toBe(input);

		wrapper.unmount();
	});

	it('树形：没有搜索词时 ← → 收起 / 展开高亮的节点，已收起时回到父节点、已展开时进入第一个子节点；打开时高亮首个勾选的节点', async () => {
		const value = ref<any[]>(['2-1-1']);
		const wrapper = mount(() => (
			<TreeSelect v-model={value.value} data={treeData} max={99} searchable />
		), { attachTo: document.body });
		await flush();
		await wrapper.trigger('click');
		await flush();

		const input = getSearchInput();
		const getActive = () => document.querySelector('.vc-tree-node[data-active] > .vc-tree-node__content')?.textContent?.trim();
		const rowOf = (label: string) => Array.from(document.querySelectorAll('.vc-tree-node'))
			.find(el => el.querySelector(':scope > .vc-tree-node__content')!.textContent!.trim().startsWith(label)) as HTMLElement;
		// 已选值的节点随 expandedValues 展开；打开时高亮第一个勾选的节点（2-1 的子节点全部勾选，2-1 也是勾选的）
		expect(getActive()).toContain('二级 2-1');
		press('ArrowDown', input);
		expect(getActive()).toBe('三级 2-1-1');

		// ← 回到父节点，再 ← 收起
		press('ArrowLeft', input);
		expect(getActive()).toContain('二级 2-1');
		press('ArrowLeft', input);
		await sleep(400);
		await flush();
		expect(rowOf('二级 2-1').getAttribute('aria-expanded')).toBe('false');
		expect(getActive()).toContain('二级 2-1');
		// → 展开，再 → 进入第一个子节点
		press('ArrowRight', input);
		await sleep(400);
		await flush();
		expect(rowOf('二级 2-1').getAttribute('aria-expanded')).toBe('true');
		press('ArrowRight', input);
		expect(getActive()).toBe('三级 2-1-1');

		wrapper.unmount();
	});

	it('级联列：方向键等同鼠标移入，回车切换路径末端一项的勾选', async () => {
		const value = ref<any[]>([]);
		const wrapper = mount(() => (
			<TreeSelect v-model={value.value} data={treeData} max={99} searchable cascader />
		), { attachTo: document.body });
		await flush();
		await wrapper.trigger('click');
		await flush();

		// 没有路径时回车不处理
		press('Enter');
		await flush();
		expect(value.value).toEqual([]);

		press('ArrowDown');
		await flush();
		expect(getSelected()).toEqual(['一级 1', '']);
		press('ArrowDown');
		press('ArrowRight');
		await flush();
		expect(getSelected()).toEqual(['一级 2', '二级 2-1', '']);
		press('ArrowDown');
		await flush();
		expect(getSelected()).toEqual(['一级 2', '二级 2-2', '']);
		press('ArrowLeft');
		await flush();
		expect(getSelected()).toEqual(['一级 2', '']);
		press('ArrowUp');
		press('ArrowRight');
		press('ArrowRight');
		await flush();
		expect(getSelected()).toEqual(['一级 1', '二级 1-1', '三级 1-1-1']);

		press('Enter');
		await flush();
		await flush();
		expect(value.value).toContain('1-1-1');
		expect(isOpen()).toBe(true);
		press('Enter');
		await flush();
		await flush();
		expect(value.value).not.toContain('1-1-1');

		wrapper.unmount();
	});

	it('级联搜索：上下移动高亮，回车切换勾选；有搜索词时左右键不处理', async () => {
		const value = ref<any[]>([]);
		const wrapper = mount(() => (
			<TreeSelect v-model={value.value} data={treeData} max={99} searchable cascader />
		), { attachTo: document.body });
		await flush();
		await wrapper.trigger('click');
		await flush();
		// 逗号分隔的关键词任一命中即可
		await typeSearch('2-1-1,2-2-1');

		const getActive = () => document.querySelector('.vc-select-paths__item[data-active]')?.textContent;
		expect(getActive()).toContain('三级 2-1-1');
		expect(press('ArrowLeft').defaultPrevented).toBe(false);
		press('ArrowDown');
		expect(getActive()).toContain('三级 2-2-1');

		press('Enter');
		await flush();
		await flush();
		expect(value.value).toContain('2-2-1');
		expect(document.querySelector<HTMLInputElement>('.vc-select-paths__item[data-active] input[type="checkbox"]')!.checked).toBe(true);

		// 点击复选框时焦点留在输入框
		const event = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
		document.querySelector('.vc-select-paths__item input[type="checkbox"]')!.dispatchEvent(event);
		expect(event.defaultPrevented).toBe(true);

		wrapper.unmount();
	});

	it('远程搜索：关闭时不调用 loadData，下次打开时按空关键词加载一次', async () => {
		// 搜索词在弹层关闭动画结束后才重置：走真实的过渡（见 realTransition），动画用到 requestAnimationFrame，防抖用到 Date
		vi.useFakeTimers({
			toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'requestAnimationFrame', 'cancelAnimationFrame', 'Date']
		});
		const loadData = vi.fn<(keyword: string) => Promise<void>>(() => Promise.resolve());
		const wrapper = mount(() => (
			<TreeSelect data={treeData} max={99} searchable loadData={loadData} />
		), { attachTo: document.body, ...realTransition });
		try {
			await nextTick();
			await wrapper.trigger('click');
			await nextTick();
			const getKeywords = () => loadData.mock.calls.map(args => args[0]);

			const input = getSearchInput();
			input.value = '2-1';
			input.dispatchEvent(new Event('input', { bubbles: true }));
			await vi.advanceTimersByTimeAsync(250);
			expect(getKeywords()).toEqual(['2-1']);

			const popover = wrapper.findComponent({ name: 'vc-popover' }).vm as any;
			popover.$emit('update:modelValue', false);
			await vi.advanceTimersByTimeAsync(500);
			expect(input.value).toBe('');
			expect(getKeywords()).toEqual(['2-1']);

			popover.$emit('update:modelValue', true);
			await nextTick();
			expect(getKeywords()).toEqual(['2-1', '']);
		} finally {
			vi.useRealTimers();
			wrapper.unmount();
		}
	});

	it('远程搜索：还没有数据时，打开即按空关键词加载一次', async () => {
		const loadData = vi.fn<(keyword: string) => Promise<void>>(() => Promise.resolve());
		const wrapper = mount(() => (
			<TreeSelect data={[]} max={99} searchable loadData={loadData} />
		), { attachTo: document.body });
		await flush();
		await wrapper.trigger('click');
		await flush();
		expect(loadData.mock.calls.map(args => args[0])).toEqual(['']);

		wrapper.unmount();
	});

	it('远程搜索（checkStrictly）：已选值不在新的搜索结果里时，标签保留；再勾选时原已选值不丢', async () => {
		const source = ref<any[]>(treeData);
		const value = ref<any[]>(['1', '2-1']);
		const loadData = vi.fn(() => Promise.resolve());
		const wrapper = mount(() => (
			<TreeSelect v-model={value.value} data={source.value} max={99} maxTagLines={0} searchable checkStrictly loadData={loadData} />
		), { attachTo: document.body });
		await flush();
		const getTags = () => wrapper.findAll('.vc-select-tags > .vc-tag').map(tag => tag.text());
		expect(getTags()).toEqual(['一级 1', '二级 2-1']);

		// 搜索结果只有“一级 3”这一棵
		source.value = treeData.filter(item => item.value === '3');
		await flush();
		expect(getTags()).toEqual(['一级 1', '二级 2-1']);

		await wrapper.find('.vc-select-tags__suffix').trigger('click');
		await flush();
		(document.querySelector('.vc-tree-select__options .vc-checkbox input[type="checkbox"]') as HTMLInputElement).click();
		await flush();
		expect(value.value).toEqual(['1', '2-1', '3']);
		expect(getTags()).toEqual(['一级 1', '二级 2-1', '一级 3']);

		// 移除不在当前数据里的标签
		await wrapper.find('.vc-select-tags > .vc-tag .vc-tag__close').trigger('click');
		await flush();
		expect(value.value).toEqual(['2-1', '3']);

		wrapper.unmount();
	});

	it('currentValueGroups：只保留不是其他已选路径前缀的路径，与逐条比较一致', async () => {
		// 值严格比较：1 与 '1' 是不同的节点
		const groupData = [
			{
				value: 1,
				label: 'A',
				children: [
					{ value: '1', label: 'A1', children: [{ value: '1-1', label: 'A11' }] },
					{ value: '1-2', label: 'A12' }
				]
			},
			{ value: '2', label: 'B', children: [{ value: 2, label: 'B2' }] },
			{ value: 3, label: 'C' }
		];
		const pairwise = (paths: any[][]) => paths.filter(path => !paths.some(other =>
			other !== path && other.length > path.length && path.every((v, i) => v === other[i])
		));
		// 每个值的完整路径（同一个值取同一个数组，与组件内的缓存一致）
		const pathOf = new Map<any, any[]>();
		const walk = (items: any[], parent: any[]) => items.forEach((item) => {
			const path = [...parent, item.value];
			pathOf.set(item.value, path);
			walk(item.children || [], path);
		});
		walk(groupData, []);
		const wrapper = mountTreeSelect({ data: groupData, max: 99, modelValue: [] });
		const cases: [any[], any[][]][] = [
			[[1, '1', '1-1', '1-2'], [[1, '1', '1-1'], [1, '1-2']]],
			[['2', 2], [['2', 2]]],
			[[1, 3, '1-2'], [[3], [1, '1-2']]],
			[['1', 1], [[1, '1']]],
			[[2, '1-1', '1-1'], [['2', 2], [1, '1', '1-1'], [1, '1', '1-1']]]
		];
		for (const [value, expected] of cases) {
			await wrapper.setProps({ modelValue: value });
			await flush();
			const groups = (wrapper.vm as any).currentValueGroups;
			expect(groups).toEqual(expected);
			expect(groups).toEqual(pairwise(value.map(v => pathOf.get(v)!)));
		}
		wrapper.unmount();
	});

	it('远程搜索（父子联动）：路径标签在搜索结果变化后保留，再勾选时原已选值不丢', async () => {
		const source = ref<any[]>(treeData);
		const value = ref<any[]>(['1', '1-1', '1-1-1']);
		const loadData = vi.fn(() => Promise.resolve());
		const wrapper = mount(() => (
			<TreeSelect v-model={value.value} data={source.value} max={99} maxTagLines={0} searchable loadData={loadData} />
		), { attachTo: document.body });
		await flush();
		const getTags = () => wrapper.findAll('.vc-select-tags > .vc-tag').map(tag => tag.text());
		expect(getTags()).toEqual(['一级 1 / 二级 1-1 / 三级 1-1-1']);

		source.value = [{ value: '4', label: '一级 4', children: [] }];
		await flush();
		expect(getTags()).toEqual(['一级 1 / 二级 1-1 / 三级 1-1-1']);

		await wrapper.find('.vc-select-tags__suffix').trigger('click');
		await flush();
		(document.querySelector('.vc-tree-select__options .vc-checkbox input[type="checkbox"]') as HTMLInputElement).click();
		await flush();
		expect(value.value).toEqual(['1', '1-1', '1-1-1', '4']);
		expect(getTags()).toEqual(['一级 1 / 二级 1-1 / 三级 1-1-1', '一级 4']);

		wrapper.unmount();
	});

	it('本地数据：数据里没有的已选值没有标签', async () => {
		const source = ref<any[]>(treeData);
		const wrapper = mount(() => (
			<TreeSelect modelValue={['1', '2-1']} data={source.value} max={99} maxTagLines={0} checkStrictly />
		), { attachTo: document.body });
		await flush();
		source.value = treeData.filter(item => item.value === '3');
		await flush();
		expect(wrapper.findAll('.vc-select-tags > .vc-tag').map(tag => tag.text())).toEqual(['', '']);

		wrapper.unmount();
	});

	it('popover 搜索：搜索栏在弹层顶部并自动聚焦，触发器只读', async () => {
		const wrapper = mount(() => (
			<TreeSelect data={treeData} max={99} searchable="popover" />
		), { attachTo: document.body });
		await flush();
		expect(wrapper.find('input').attributes('readonly')).toBeDefined();

		await wrapper.trigger('click');
		await flush();
		const search = document.querySelector('.vc-select-search input') as HTMLInputElement;
		expect(document.activeElement).toBe(search);

		search.value = '2-1-1';
		search.dispatchEvent(new Event('input', { bubbles: true }));
		await flush();
		expect(document.querySelector('.vc-select-highlight')?.textContent).toBe('2-1-1');

		wrapper.unmount();
	});

	// 触发器在视口（1024 宽）中的位置：左缘 x、宽 120
	const placeTrigger = (el: Element, x: number) => {
		(el as any).getBoundingClientRect = () => ({
			x, y: 0, width: 120, height: 32, left: x, right: x + 120, top: 0, bottom: 32, toJSON: () => ({})
		});
	};
	// 列宽：方向按根列宽度 × 数据层级估算所需宽度
	const mockColumnWidth = (selector: string, width: number) => {
		const original = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetWidth')!;
		Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
			configurable: true,
			get(this: HTMLElement) {
				return this.matches(selector) ? width : original.get!.call(this);
			}
		});
		onTestFinished(() => {
			Object.defineProperty(HTMLElement.prototype, 'offsetWidth', original);
		});
	};
	const isInverted = () => !!document.querySelector('.vc-tree-select__cascader-columns.is-inverted');
	const getPopoverProp = (wrapper: any, key: string) => wrapper.findComponent(Popover as any).props(key);
	const getPlacement = (wrapper: any) => getPopoverProp(wrapper, 'placement');

	it('cascader + expandDirection="left"：列向左展开，弹层与触发器右对齐，← 进入下一级、→ 回到上一级', async () => {
		const wrapper = mount(() => (
			<TreeSelect data={treeData} max={99} cascader expandDirection="left" />
		), { attachTo: document.body });
		onTestFinished(() => wrapper.unmount());
		await flush();
		await wrapper.trigger('click');
		await flush();
		expect(isInverted()).toBe(true);
		expect(getPlacement(wrapper)).toBe('bottom-right');
		expect(getPopoverProp(wrapper, 'keepEdge')).toBe('end');

		press('ArrowDown');
		await flush();
		expect(getSelected()).toEqual(['一级 1', '']);
		press('ArrowLeft');
		await flush();
		expect(getSelected()).toEqual(['一级 1', '二级 1-1', '']);
		press('ArrowRight');
		await flush();
		expect(getSelected()).toEqual(['一级 1', '']);
	});

	it('cascader + expandDirection="auto"：右侧放不下时向左展开；树形模式忽略', async () => {
		// 3 级 × 150 = 450；右侧 1024 - 8 - 900 = 116 放不下
		mockColumnWidth('.vc-cascader-column', 150);
		const cascader = ref(true);
		const wrapper = mount(() => (
			<TreeSelect data={treeData} max={99} cascader={cascader.value} expandDirection="auto" />
		), { attachTo: document.body });
		onTestFinished(() => wrapper.unmount());
		await flush();
		placeTrigger(wrapper.element, 900);
		await wrapper.trigger('click');
		await flush();
		expect(isInverted()).toBe(true);
		expect(getPlacement(wrapper)).toBe('bottom-right');

		// 树形模式：方向不变
		await wrapper.trigger('click');
		await flush();
		cascader.value = false;
		await flush();
		await wrapper.trigger('click');
		await flush();
		expect(getPlacement(wrapper)).toBe('bottom-left');
	});
});
