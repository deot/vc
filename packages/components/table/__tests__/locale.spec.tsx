// @vitest-environment jsdom

import { Table, TableColumn, VcInstance } from '@deot/vc-components';
import { enUS, zhCN } from '@deot/vc-locale';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { TableFilter } from '../table-header/table-filter';

afterEach(() => {
	VcInstance.configure({ locale: zhCN });
});

it('updates empty and summary text when the locale changes and preserves explicit empty strings', async () => {
	const empty = mount(Table);
	const summary = mount(Table, {
		props: { data: [{ name: 'A', count: 2 }], showSummary: true },
		slots: { default: () => [<TableColumn prop="name" />, <TableColumn prop="count" />] }
	});
	try {
		await nextTick();
		expect(empty.text()).toContain('暂无数据');
		expect(summary.find('.vc-table__footer').text()).toContain('合计');
		VcInstance.configure({ locale: enUS });
		await nextTick();
		expect(empty.text()).toContain('No data');
		expect(summary.find('.vc-table__footer').text()).toContain('Total');
		await empty.setProps({ emptyText: 'Custom empty' });
		await summary.setProps({ sumText: 'Custom total' });
		expect(empty.text()).toContain('Custom empty');
		expect(summary.find('.vc-table__footer').text()).toContain('Custom total');
		await empty.setProps({ emptyText: '' });
		await summary.setProps({ sumText: '' });
		expect(empty.find('.vc-table__empty-text').text()).toBe('');
		expect(summary.find('.vc-table__footer .vc-table__cell').text()).toBe('');
	} finally {
		empty.unmount();
		summary.unmount();
	}
});

it('updates single and multiple filter actions while mounted', async () => {
	const wrapper = mount(TableFilter, {
		props: { max: 2 },
		global: { stubs: { 'vc-dropdown': { template: '<div><slot /><slot name="content" /><slot name="footer" /></div>' } } }
	});
	try {
		expect(wrapper.text()).toContain('重置');
		expect(wrapper.text()).toContain('确认');
		VcInstance.configure({ locale: enUS });
		await nextTick();
		expect(wrapper.text()).toContain('Reset');
		expect(wrapper.text()).toContain('Confirm');
		await wrapper.setProps({ max: 1 });
		expect(wrapper.text()).toContain('All');
		VcInstance.configure({ locale: zhCN });
		await nextTick();
		expect(wrapper.text()).toContain('全部');
	} finally {
		wrapper.unmount();
	}
});
