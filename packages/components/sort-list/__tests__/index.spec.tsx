// @vitest-environment jsdom

import { SortList, MSortList } from '@deot/vc-components';
import { mount } from '@vue/test-utils';
import { defineComponent, nextTick, provide, ref } from 'vue';
import { describe, expect, it, vi } from 'vitest';

const createRows = () => {
	return Array.from({ length: 5 }, (_, index) => ({
		id: `${index}`,
		label: `Item ${index}`
	}));
};

const createDataTransfer = () => {
	return {
		effectAllowed: '',
		setData: vi.fn(),
		clearData: vi.fn()
	};
};

const dispatchDrag = (el: Element, type: string, dataTransfer: ReturnType<typeof createDataTransfer> | null = createDataTransfer()) => {
	const e = new Event(type, {
		bubbles: true,
		cancelable: true
	}) as DragEvent;

	dataTransfer !== null && Object.defineProperty(e, 'dataTransfer', {
		value: dataTransfer
	});
	el.dispatchEvent(e);

	return e;
};

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof SortList).toBe('object');
		expect(typeof MSortList).toBe('object');
	});

	it('create: 渲染列表和 row/index 插槽参数', () => {
		const rows = createRows();
		const empty = mount(() => (<SortList />));
		const wrapper = mount(() => (
			<SortList modelValue={rows}>
				{({ row, index }) => <div class="row">{`${row.label}-${index}`}</div>}
			</SortList>
		));

		expect(empty.classes()).toContain('vc-sort-list');
		expect(empty.findAll('.vc-sort-list__item')).toHaveLength(0);
		expect(wrapper.classes()).toContain('vc-sort-list');
		expect(wrapper.findAll('.vc-sort-list__item')).toHaveLength(5);
		expect(wrapper.findAll('.row').map(i => i.text())).toEqual([
			'Item 0-0',
			'Item 1-1',
			'Item 2-2',
			'Item 3-3',
			'Item 4-4'
		]);
	});

	it('mask click: 支持左移、右移和删除', async () => {
		const rows = ref(createRows());
		const onUpdate = vi.fn((value) => {
			rows.value = value;
		});
		const onChange = vi.fn();
		const wrapper = mount(() => (
			<SortList
				modelValue={rows.value}
				onUpdate:modelValue={onUpdate}
				onChange={onChange}
			>
				{({ row }) => <div>{row.id}</div>}
			</SortList>
		));

		const getIds = () => rows.value.map(row => row.id);
		const getMask = (index: number) => wrapper.findAll('.vc-sort-list__item')[index].find('.vc-sort-list__mask');

		await getMask(2).findAll('span')[0].trigger('click');
		expect(getIds()).toEqual(['0', '2', '1', '3', '4']);
		expect(onUpdate).toHaveBeenCalled();
		expect(onChange).toHaveBeenCalledWith(rows.value);

		await nextTick();
		await getMask(1).findAll('span')[2].trigger('click');
		expect(getIds()).toEqual(['0', '1', '2', '3', '4']);

		await nextTick();
		await getMask(2).findAll('span')[1].trigger('click');
		expect(getIds()).toEqual(['0', '1', '3', '4']);
	});

	it('drag: 支持对象数组排序', async () => {
		const rows = ref(createRows());
		const wrapper = mount(() => (
			<SortList
				modelValue={rows.value}
				onUpdate:modelValue={value => (rows.value = value)}
			>
				{({ row }) => <div>{row.id}</div>}
			</SortList>
		));
		const items = wrapper.findAll('.vc-sort-list__item');
		const dataTransfer = createDataTransfer();

		vi.useFakeTimers();
		dispatchDrag(items[0].element, 'dragstart', dataTransfer);
		dispatchDrag(items[1].element, 'dragenter', dataTransfer);
		dispatchDrag(items[1].element, 'dragenter', dataTransfer);
		dispatchDrag(items[1].element, 'dragover', dataTransfer);
		vi.runAllTimers();
		dispatchDrag(items[0].element, 'dragend', dataTransfer);
		vi.useRealTimers();
		await nextTick();

		expect(rows.value.map(row => row.id)).toEqual(['1', '0', '2', '3', '4']);
		expect(dataTransfer.setData).toHaveBeenCalled();
		expect(dataTransfer.clearData).toHaveBeenCalled();
	});

	it('drag: 支持简单值排序', async () => {
		const rows = ref([1, 2, 3, 4, 5]);
		const wrapper = mount(() => (
			<SortList
				modelValue={rows.value}
				onUpdate:modelValue={value => (rows.value = value)}
			>
				{({ row }) => <div>{row}</div>}
			</SortList>
		));
		const items = wrapper.findAll('.vc-sort-list__item');
		const dataTransfer = createDataTransfer();

		dispatchDrag(items[0].element, 'dragstart', dataTransfer);
		dispatchDrag(items[1].element, 'dragenter', dataTransfer);
		dispatchDrag(items[0].element, 'dragend', dataTransfer);
		await nextTick();

		expect(rows.value).toEqual([2, 1, 3, 4, 5]);
	});

	it('drag: 缺少拖拽源、拖到自身和无 dataTransfer 时保持稳定', async () => {
		const rows = ref(createRows());
		const wrapper = mount(() => (
			<SortList
				modelValue={rows.value}
				onUpdate:modelValue={value => (rows.value = value)}
			>
				{({ row }) => <div>{row.id}</div>}
			</SortList>
		));
		const items = wrapper.findAll('.vc-sort-list__item');

		dispatchDrag(items[1].element, 'dragenter');
		dispatchDrag(items[0].element, 'dragstart', null);
		dispatchDrag(items[0].element, 'dragenter');
		dispatchDrag(items[0].element, 'dragend');
		await nextTick();

		expect(rows.value.map(row => row.id)).toEqual(['0', '1', '2', '3', '4']);
	});

	it('mask=false: 不渲染操作遮罩', () => {
		const wrapper = mount(() => (
			<SortList modelValue={createRows()} mask={false}>
				{({ row }) => <div>{row.id}</div>}
			</SortList>
		));

		expect(wrapper.find('.vc-sort-list__mask').exists()).toBe(false);
	});

	it('draggable 和 draggableKey: 控制拖拽能力', async () => {
		const rows = ref([
			{ id: '0', enabled: true },
			{ id: '1', enabled: false },
			{ id: '2', enabled: true }
		]);
		const wrapper = mount(() => (
			<SortList
				modelValue={rows.value}
				draggableKey="enabled"
				onUpdate:modelValue={value => (rows.value = value)}
			>
				{({ row }) => <div>{row.id}</div>}
			</SortList>
		));
		const items = wrapper.findAll('.vc-sort-list__item');
		const dataTransfer = createDataTransfer();

		expect(items[0].attributes('draggable')).toBe('true');
		expect(items[1].attributes('draggable')).toBe('false');

		dispatchDrag(items[1].element, 'dragstart', dataTransfer);
		dispatchDrag(items[1].element, 'dragover', dataTransfer);
		dispatchDrag(items[0].element, 'dragstart', dataTransfer);
		dispatchDrag(items[1].element, 'dragenter', dataTransfer);
		dispatchDrag(items[0].element, 'dragend', dataTransfer);
		await nextTick();

		expect(rows.value.map(row => row.id)).toEqual(['0', '1', '2']);
	});

	it('primaryKey: 支持指定对象主键', async () => {
		const rows = ref([
			{ __id: 'a' },
			{ __id: 'b' },
			{ __id: 'c' }
		]);
		const wrapper = mount(() => (
			<SortList
				modelValue={rows.value}
				primaryKey="__id"
				onUpdate:modelValue={value => (rows.value = value)}
			>
				{({ row }) => <div>{row.__id}</div>}
			</SortList>
		));

		await wrapper.findAll('.vc-sort-list__item')[0].find('.vc-sort-list__mask').findAll('span')[2].trigger('click');

		expect(rows.value.map(row => row.__id)).toEqual(['b', 'a', 'c']);
	});

	it('change: 在 FormItem 内通知表单项', async () => {
		const rows = ref(createRows());
		const formItemChange = vi.fn();
		const wrapper = mount(defineComponent({
			setup() {
				provide('vc-form-item', {
					change: formItemChange
				});

				return () => (
					<SortList
						modelValue={rows.value}
						onUpdate:modelValue={value => (rows.value = value)}
					>
						{({ row }) => <div>{row.id}</div>}
					</SortList>
				);
			}
		}));

		await wrapper.findAll('.vc-sort-list__item')[0].find('.vc-sort-list__mask').findAll('span')[1].trigger('click');

		expect(formItemChange).toHaveBeenCalledWith(rows.value);
	});

	it('getSortList: 暴露排序计算方法', () => {
		const rows = createRows();
		const wrapper = mount(SortList, {
			props: {
				modelValue: rows
			}
		});
		const vm = wrapper.vm as any;

		expect(vm.getSortList({ row: rows[1], index: 1, type: 'delete' }).map((row: any) => row.id)).toEqual(['0', '2', '3', '4']);
		expect(vm.getSortList({ row: rows[2], index: 2, type: 'left' }).map((row: any) => row.id)).toEqual(['0', '2', '1', '3', '4']);
	});

	it('mobile: 渲染移动端样式并复用拖拽排序', async () => {
		const rows = ref(createRows());
		const empty = mount(() => (<MSortList modelValue={[1, 2]} />));
		const wrapper = mount(() => (
			<MSortList
				modelValue={rows.value}
				onUpdate:modelValue={value => (rows.value = value)}
			>
				{({ row, index }) => <div class="mobile-row">{`${row.id}-${index}`}</div>}
			</MSortList>
		));
		const items = wrapper.findAll('.vcm-sort-list__item');
		const dataTransfer = createDataTransfer();

		expect(empty.findAll('.vcm-sort-list__item')).toHaveLength(2);
		expect(wrapper.classes()).toContain('vcm-sort-list');
		expect(wrapper.find('.vc-sort-list__mask').exists()).toBe(false);
		expect(wrapper.findAll('.mobile-row').map(i => i.text())).toEqual(['0-0', '1-1', '2-2', '3-3', '4-4']);

		await items[0].trigger('touchmove');
		dispatchDrag(items[0].element, 'dragstart', dataTransfer);
		dispatchDrag(items[1].element, 'dragenter', dataTransfer);
		dispatchDrag(items[1].element, 'dragover', dataTransfer);
		dispatchDrag(items[0].element, 'dragend', dataTransfer);
		await nextTick();

		expect(rows.value.map(row => row.id)).toEqual(['1', '0', '2', '3', '4']);
	});
});
