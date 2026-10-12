// @vitest-environment jsdom

import { Select } from '@deot/vc-components';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { vi } from 'vitest';
import { Utils } from '@deot/dev-test';

const DATA = [{ value: 1, label: 'A' }, { value: 2, label: 'B' }];
const GROUPED = [{ value: 'g', label: 'G', children: DATA }];

const flush = async () => {
	await nextTick();
	await Utils.sleep(0);
	await nextTick();
};

// 展开下拉后才会渲染选项
const open = async (props: Record<string, any>, slots: Record<string, any> = {}) => {
	const wrapper = mount(() => (<Select {...props} v-slots={slots} />), { attachTo: document.body });
	await nextTick();
	await wrapper.trigger('click');
	await flush();
	return wrapper;
};

describe('选项的渲染函数与插槽', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('渲染函数收到 { row, store }，根节点上没有透传属性', async () => {
		const renderOption = vi.fn(({ row }: any) => (<div class="render-option">{ row.label }</div>));
		const wrapper = await open({ data: DATA, renderOption });

		expect(Object.keys((renderOption.mock.calls[0] as any)[0]).sort()).toEqual(['row', 'store']);
		const el = document.querySelector('.render-option')!;
		expect(el.getAttributeNames()).toEqual(['class']);
		wrapper.unmount();

		const renderLabel = vi.fn(({ row }: any) => (<i class="render-label">{ row.label }</i>));
		const wrapper$ = await open({ data: DATA, renderLabel });
		expect(document.querySelector('.vc-select-option > .render-label')!.getAttributeNames()).toEqual(['class']);
		wrapper$.unmount();
	});

	it('option / label 插槽优先于 renderOption / renderLabel', async () => {
		const renderOption = vi.fn(() => (<div class="render-option" />));
		const wrapper = await open({ data: DATA, renderOption }, { option: ({ row }: any) => (<div class="slot-option">{ row.label }</div>) });

		expect(document.querySelectorAll('.slot-option').length).toBe(2);
		expect(renderOption).not.toHaveBeenCalled();
		wrapper.unmount();

		const renderLabel = vi.fn(() => (<i class="render-label" />));
		const wrapper$ = await open({ data: DATA, renderLabel }, { label: ({ row }: any) => (<i class="slot-label">{ row.label }</i>) });
		expect(document.querySelectorAll('.vc-select-option > .slot-label').length).toBe(2);
		expect(renderLabel).not.toHaveBeenCalled();
		wrapper$.unmount();
	});

	it('optionGroup 插槽优先于 renderOptionGroup', async () => {
		const renderOptionGroup = vi.fn(({ row }: any) => (<div class="render-group">{ row.label }</div>));
		const wrapper = await open({ data: GROUPED, renderOptionGroup });
		expect(document.querySelector('.render-group')!.getAttributeNames()).toEqual(['class']);
		wrapper.unmount();

		renderOptionGroup.mockClear();
		const wrapper$ = await open({ data: GROUPED, renderOptionGroup }, { optionGroup: () => (<div class="slot-group" />) });
		expect(document.querySelector('.slot-group')).not.toBe(null);
		expect(renderOptionGroup).not.toHaveBeenCalled();
		wrapper$.unmount();
	});
});
