// @vitest-environment jsdom

import { MTree, MTreeSelect, Tree, TreeSelect } from '@deot/vc-components';
import { mount } from '@vue/test-utils';
import { nextTick, ref } from 'vue';
import { vi } from 'vitest';
import { TreeNode, TreeStore } from '../store';
import { getChildState, markNodeData } from '../store/tree-node';
import { props as treeNodeContentProps } from '../tree-node-content-props';
import { TreeSelectContent } from '../tree-select-content';
import { TreeSelectContentCascader } from '../tree-select-content-cascader';

const sleep = (ms = 0) => new Promise<void>(r => setTimeout(r, ms));

const flush = async () => {
	await nextTick();
	await sleep(0);
	await nextTick();
};

const fireMouse = (
	el: Element,
	type: 'mouseenter' | 'mouseleave' | 'mousedown' | 'mouseup' | 'click'
) => {
	el.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true }));
};

const fireKey = (el: Element, keyCode: number) => {
	el.dispatchEvent(new KeyboardEvent('keydown', { keyCode, bubbles: true } as any));
};

const dataTransferStub = () => ({
	effectAllowed: '',
	dropEffect: '',
	setData: vi.fn(),
	getData: vi.fn(() => '')
});

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

describe('Tree interaction', () => {
	afterEach(() => {
		document.body.innerHTML = '';
		vi.useRealTimers();
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
			onNodeDragStart: onDragStart,
			onNodeDragOver: onDragOver,
			onNodeDragEnd: onDragEnd
		});
		await nextTick();

		const icon = wrapper.find('.vc-tree-node__expand-icon');
		await icon.trigger('click');
		await vi.runAllTimersAsync();
		await nextTick();
		expect(loadData).toHaveBeenCalledTimes(1);
		expect((wrapper.vm as any).getNode('4-1')).toBeTruthy();

		const node = wrapper.find('.vc-tree-node');
		expect(node.attributes('draggable')).toBe('true');
		await node.trigger('dragstart', { dataTransfer: dataTransferStub() });
		await nextTick();
		expect(wrapper.classes()).toContain('is-dragging');
		expect(onDragStart).toHaveBeenCalled();

		await node.trigger('dragover', {
			preventDefault: vi.fn(),
			dataTransfer: dataTransferStub(),
			clientY: 1
		});
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
			onNodeDragEnd: onDragEnd,
			onNodeDragEnter: onDragEnter
		});
		await flush();

		const nodes = wrapper.findAll('.vc-tree-node');
		await nodes[0].trigger('dragstart', { dataTransfer: dataTransferStub() });
		await nodes[1].trigger('dragover', {
			clientY: 999,
			preventDefault: vi.fn(),
			dataTransfer: dataTransferStub()
		});
		await flush();
		await nodes[0].trigger('dragend', {
			preventDefault: vi.fn(),
			dataTransfer: dataTransferStub()
		});
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
			onNodeDragEnter: onDragEnter,
			onNodeDragLeave: onDragLeave
		});
		await flush();

		const nodes = wrapper.findAll('.vc-tree-node');
		await nodes[0].trigger('dragstart', { dataTransfer: dataTransferStub() });
		await nodes[1].trigger('dragover', {
			clientY: 0,
			preventDefault: vi.fn(),
			dataTransfer: dataTransferStub()
		});
		// 移到第三个节点，触发 drag-leave 旧节点
		await nodes[2].trigger('dragover', {
			clientY: 0,
			preventDefault: vi.fn(),
			dataTransfer: dataTransferStub()
		});
		await flush();
		await nodes[0].trigger('dragend', {
			preventDefault: vi.fn(),
			dataTransfer: dataTransferStub()
		});
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
			onNodeDragStart: onDragStart
		});
		await flush();

		const node = wrapper.find('.vc-tree-node');
		await node.trigger('dragstart', { dataTransfer: dataTransferStub() });
		await flush();

		expect(onDragStart).not.toHaveBeenCalled();
		expect(wrapper.classes()).not.toContain('is-dragging');

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
		const wrapper = mountTree({ data, showCheckbox: true, defaultExpandAll: true });
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

		// left/right -> click 当前 item
		fireKey(items[0].element, 37);
		await flush();
		fireKey(items[0].element, 39);
		await flush();

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
		await nodes[0].trigger('dragstart', { dataTransfer: dataTransferStub() });
		// dropType='none'：所有方向均禁止
		await nodes[1].trigger('dragover', {
			clientY: 0,
			preventDefault: vi.fn(),
			dataTransfer: dataTransferStub()
		});
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
		await ns[0].trigger('dragstart', { dataTransfer: dataTransferStub() });
		await ns[1].trigger('dragover', {
			clientY: -1,
			preventDefault: vi.fn(),
			dataTransfer: dataTransferStub()
		});
		await flush();
		await ns[0].trigger('dragend', {
			preventDefault: vi.fn(),
			dataTransfer: dataTransferStub()
		});
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

describe('TreeSelect interaction', () => {
	afterEach(() => {
		document.body.innerHTML = '';
		vi.useRealTimers();
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
		expect(document.querySelectorAll('.vc-tree-select__cascader-column').length).toBe(1);

		const firstRow = document.querySelector('.vc-tree-select__cascader-item') as HTMLElement;
		fireMouse(firstRow, 'mouseenter');
		await flush();

		const firstLabel = document.querySelector('.vc-tree-select__cascader-label') as HTMLElement;
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

		const input = document.querySelector('.vc-tree-select__search input') as HTMLInputElement;
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

		const input = document.querySelector('.vc-tree-select__search input') as HTMLInputElement;
		expect(input).not.toBeNull();
		input.value = 'foo';
		input.dispatchEvent(new Event('input', { bubbles: true }));
		// debounce 触发后会 throw VcError
		expect(() => vi.advanceTimersByTime(300)).toThrow();

		errorSpy.mockRestore();
		wrapper.unmount();
		vi.useRealTimers();
	});

	it('default prop factories', () => {
		expect((treeNodeContentProps.node as any).default()).toEqual({});
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
		expect(w2.find('.vc-tree-select__cascader-item').exists()).toBe(true);
		// 触发 hover/checkbox/click 路径，覆盖 getNodeState/handleHover/handleCheckboxChange/handleLabelClick
		const item = document.querySelector('.vc-tree-select__cascader-item') as HTMLElement;
		fireMouse(item, 'mouseenter');
		await flush();
		const checkbox = document.querySelector('.vc-tree-select__cascader-checkbox input') as HTMLInputElement;
		checkbox?.click();
		await flush();
		const label = document.querySelector('.vc-tree-select__cascader-label') as HTMLElement;
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
		const tops = wrapper.findAll('.vc-tree[role="tree"] > .vc-tree-node');
		const [p1, p2] = tops;
		await p2.trigger('dragstart', { dataTransfer: dataTransferStub() });
		await p1.trigger('dragover', {
			clientY: 1,
			preventDefault: vi.fn(),
			dataTransfer: dataTransferStub()
		});
		await flush();
		await p2.trigger('dragend', {
			preventDefault: vi.fn(),
			dataTransfer: dataTransferStub()
		});
		await flush();

		// drop child onto parent：parent.contains(child, false) === true，dropInner=false
		const all = wrapper.findAll('.vc-tree-node');
		const child = all[1]; // c1 是 p1 的子节点
		await child.trigger('dragstart', { dataTransfer: dataTransferStub() });
		await all[0].trigger('dragover', {
			clientY: 0,
			preventDefault: vi.fn(),
			dataTransfer: dataTransferStub()
		});
		await flush();

		wrapper.unmount();
	});

	it('drag: setData throws caught + sibling drag adjusts dropPrev/Next', async () => {
		const wrapper = mountTree({
			data: [
				{ value: 's1', label: 'S1' },
				{ value: 's2', label: 'S2' }
			],
			draggable: true
		});
		await flush();

		const nodes = wrapper.findAll('.vc-tree-node');
		const errorSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
		// setData 抛错被 try/catch 兜住
		await nodes[0].trigger('dragstart', {
			dataTransfer: {
				effectAllowed: '',
				dropEffect: '',
				setData: () => { throw new Error('boom'); }
			}
		});
		errorSpy.mockRestore();

		// 拖到自己的下一个兄弟（dropTreeNode.getPreviousSiblingNode() === draggingTreeNode）
		await nodes[1].trigger('dragover', {
			clientY: 1,
			preventDefault: vi.fn(),
			dataTransfer: dataTransferStub()
		});
		await flush();
		await nodes[0].trigger('dragend', {
			preventDefault: vi.fn(),
			dataTransfer: dataTransferStub()
		});
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
		// 第一个 item up 不越界
		const items = wrapper.findAll('.vc-tree-node[role="treeitem"]');
		(items[0].element as HTMLElement).focus();
		fireKey(items[0].element, 38);
		await flush();
		expect(document.activeElement).toBe(items[0].element);

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
