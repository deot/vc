// @vitest-environment jsdom

import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { vi } from 'vitest';
import { CascaderColumns } from '../cascader-columns';

const COLUMNS = [
	[
		{ value: 1, label: 'A', hasChildren: true },
		{ value: 2, label: 'B', children: [{ value: 21, label: 'B1' }] },
		{ value: 3, label: 'C', loading: true, hasChildren: true },
		{ value: 4, label: 'D', disabled: true }
	],
	[
		{ value: 11, label: 'A1' },
		{ value: 12, label: 'A2' }
	],
	[]
];

const getCols = (wrapper: any) => wrapper.findAll('.vc-cascader-column');
const getCells = (wrapper: any, columnIndex: number) => getCols(wrapper)[columnIndex].findAll('.vc-cascader-column__item');

describe('cascader-columns', () => {
	it('按路径显示各列，空列不显示', async () => {
		const wrapper = mount(CascaderColumns, { props: { data: COLUMNS, value: [] } });
		expect(getCols(wrapper).length).toBe(1);

		await wrapper.setProps({ value: [1] });
		expect(getCols(wrapper).length).toBe(2);
		expect(getCols(wrapper).map((col: any) => col.attributes('data-index'))).toEqual(['0', '1']);

		// 第三列为空
		await wrapper.setProps({ value: [1, 11] });
		expect(getCols(wrapper).length).toBe(2);
	});

	it('选中、禁用、箭头与加载', async () => {
		const wrapper = mount(CascaderColumns, { props: { data: COLUMNS, value: [2] } });
		const cells = getCells(wrapper, 0);
		expect(cells.map((cell: any) => cell.attributes('data-index'))).toEqual(['0', '1', '2', '3']);
		expect(cells[1].classes()).toContain('is-select');
		expect(cells[0].classes()).not.toContain('is-select');
		expect(cells[3].classes()).toContain('is-disabled');
		// hasChildren 或 children 不为空时显示箭头，加载中显示 Spin
		expect(cells[0].find('.vc-cascader-column__icon').exists()).toBe(true);
		expect(cells[1].find('.vc-cascader-column__icon').exists()).toBe(true);
		expect(cells[2].find('.vc-cascader-column__icon').exists()).toBe(false);
		expect(cells[2].find('.vc-cascader-column__loading').exists()).toBe(true);
		expect(cells[3].find('.vc-cascader-column__icon').exists()).toBe(false);
		expect(cells[0].find('.vc-cascader-column__label').text()).toBe('A');
	});

	it('move / click 在列区统一处理，带上该项与行列', async () => {
		const onMove = vi.fn();
		const onClick = vi.fn();
		const wrapper = mount(CascaderColumns, { props: { data: COLUMNS, value: [1], onMove, onClick } });

		await getCells(wrapper, 1)[1].find('.vc-cascader-column__label').trigger('mousemove');
		expect(onMove).toHaveBeenLastCalledWith({ item: COLUMNS[1][1], columnIndex: 1, rowIndex: 1 });

		await getCells(wrapper, 0)[2].trigger('click');
		expect(onClick).toHaveBeenLastCalledWith({ item: COLUMNS[0][2], columnIndex: 0, rowIndex: 2 });

		// 不在某项上：忽略
		await getCols(wrapper)[0].trigger('mousemove');
		await getCols(wrapper)[0].trigger('click');
		expect(onMove).toHaveBeenCalledTimes(1);
		expect(onClick).toHaveBeenCalledTimes(1);
	});

	it('插槽 prefix / label', () => {
		const wrapper = mount(CascaderColumns, {
			props: { data: COLUMNS, value: [] },
			slots: {
				prefix: ({ item, columnIndex, rowIndex }: any) => <i class="prefix">{`${item.value}-${columnIndex}-${rowIndex}`}</i>,
				label: ({ item }: any) => <b>{`#${item.label}`}</b>
			}
		});
		const cell = getCells(wrapper, 0)[1];
		expect(cell.element.firstElementChild!.matches('i.prefix')).toBe(true);
		expect(cell.find('.prefix').text()).toBe('2-0-1');
		expect(cell.find('.vc-cascader-column__label').text()).toBe('#B');
	});

	it('inverted 与暴露的节点查询', async () => {
		const wrapper = mount(CascaderColumns, { props: { data: COLUMNS, value: [1] } });
		expect(wrapper.classes()).toContain('vc-cascader-columns');
		expect(wrapper.classes()).not.toContain('is-inverted');
		expect(wrapper.find('.vc-cascader-columns__content').exists()).toBe(true);

		await wrapper.setProps({ inverted: true });
		expect(wrapper.classes()).toContain('is-inverted');

		const vm = wrapper.vm as any;
		await nextTick();
		expect(vm.getColumn(1)).toBe(getCols(wrapper)[1].element);
		// 行带列表给的下标
		expect(getCells(wrapper, 1).map((cell: any) => cell.attributes('data-index'))).toEqual(['0', '1']);

		// 列内可视 0 ~ 20，每项高 20：第 2 项在可视范围之下，贴近底边；不存在的列不处理
		const rect = vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
			const index = (this as HTMLElement).dataset.index;
			const [top, bottom] = this.classList.contains('vc-cascader-column__item') ? [+index! * 20, +index! * 20 + 20] : [0, 20];
			return { top, bottom, left: 0, right: 0, width: 0, height: bottom - top, x: 0, y: top, toJSON: () => ({}) } as DOMRect;
		});
		const height = vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(20);
		// 内容总高：滚动经承载者写入，限制在可滚动范围内
		const scrollHeight = vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(1000);
		const scroller = getCols(wrapper)[1].find('.vc-scroller').element as HTMLElement;
		vm.scrollToItem(1, 1);
		expect(scroller.scrollTop).toBe(20);
		vm.scrollToItem(2, 0);
		rect.mockRestore();
		height.mockRestore();
		scrollHeight.mockRestore();
	});
});
