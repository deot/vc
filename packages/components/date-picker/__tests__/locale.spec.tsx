// @vitest-environment jsdom

import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { zhCN, enUS } from '@deot/vc-locale';
import { VcInstance } from '../../vc';
import { MDatePicker, MDatePickerView } from '../index.m';
import { MDatePickerCore } from '../mobile/date-picker-core';
import { DatePicker } from '../index';
import { TimePicker } from '../../time-picker';
import { DateTable } from '../panel/base/date-table';
import { Confirm } from '../panel/base/confirm';

describe('DatePicker locale', () => {
	it('keeps language keys, string leaves and placeholders aligned', () => {
		const inspect = (value: unknown): unknown => {
			if (typeof value === 'string') return [...value.matchAll(/\{(\w+)\}/g)].map(match => match[1]).sort();
			expect(value && typeof value === 'object' && !Array.isArray(value)).toBe(true);
			return Object.fromEntries(Object.entries(value as object).map(([key, child]) => [key, inspect(child)]));
		};
		expect(inspect(zhCN.vc.DatePicker)).toEqual(inspect(enUS.vc.DatePicker));
	});

	afterEach(() => {
		VcInstance.configure({ locale: zhCN });
	});

	it('updates shared desktop placeholders and allows empty overrides', async () => {
		for (const component of [DatePicker, TimePicker]) {
			const wrapper = mount(component);
			VcInstance.configure({ locale: enUS });
			await nextTick();
			expect(wrapper.find('input').attributes('placeholder')).toBe('Please select');
			await wrapper.setProps({ placeholder: '' });
			expect(wrapper.find('input').attributes('placeholder')).toBe('');
			wrapper.unmount();
		}
	});

	it('updates weekday headers and confirmation actions reactively', async () => {
		const table = mount(DateTable, { props: { panelDate: new Date(2026, 8, 1), focusedDate: new Date(2026, 8, 1) } });
		const confirm = mount(Confirm, { props: { showTime: true } });
		expect(table.find('th').text()).toBe('日');
		expect(confirm.text()).toContain('选择时间');
		VcInstance.configure({ locale: enUS });
		await nextTick();
		expect(table.find('th').text()).toBe('Sun');
		expect(confirm.text()).toContain('Select time');
		expect(confirm.text()).toContain('Clear');
		expect(confirm.text()).toContain('OK');
		table.unmount();
		confirm.unmount();
	});

	it('updates desktop quarter summary without changing its value', async () => {
		const wrapper = mount(DatePicker, { props: { type: 'quarter', modelValue: ['2024-01-01', '2024-03-31'] } });
		expect(wrapper.find('input').element.value).toBe('2024年第一季度');
		VcInstance.configure({ locale: enUS });
		await nextTick();
		expect(wrapper.find('input').element.value).toBe('2024 Q1');
		expect(wrapper.emitted('update:modelValue')).toBeUndefined();
		wrapper.unmount();
	});

	it('updates mobile placeholder and preserves explicit empty text', async () => {
		const wrapper = mount(MDatePicker);
		expect(wrapper.text()).toContain('请选择');
		VcInstance.configure({ locale: enUS });
		await nextTick();
		expect(wrapper.text()).toContain('Please select');
		await wrapper.setProps({ extra: '' });
		expect(wrapper.text()).not.toContain('Please select');
		wrapper.unmount();
	});

	it('updates mobile column labels without changing the selected value', async () => {
		const wrapper = mount(MDatePickerView, {
			props: { type: 'quarter', modelValue: ['2024-01-01', '2024-03-31'] }
		});
		expect(wrapper.text()).toContain('第一季度');
		VcInstance.configure({ locale: enUS });
		await nextTick();
		expect(wrapper.text()).toContain('Q1');
		expect(wrapper.text()).not.toContain('第一季度');
		expect(wrapper.emitted('update:modelValue')).toBeUndefined();
		wrapper.unmount();
	});

	it('updates mobile quarter summary', async () => {
		const wrapper = mount(MDatePicker, {
			props: { type: 'quarter', modelValue: ['2024-01-01', '2024-03-31'] }
		});
		expect(wrapper.text()).toContain('2024年第一季度');
		VcInstance.configure({ locale: enUS });
		await nextTick();
		expect(wrapper.text()).toContain('2024 Q1');
		wrapper.unmount();
	});

	it('updates popup actions and preserves explicit text overrides', async () => {
		const wrapper = mount(MDatePickerCore);
		const popup = wrapper.findComponent({ name: 'vcm-picker-popup' });
		expect(popup.props('cancelText')).toBe('取消');
		VcInstance.configure({ locale: enUS });
		await nextTick();
		expect(popup.props('cancelText')).toBe('Cancel');
		expect(popup.props('okText')).toBe('OK');
		await wrapper.setProps({ cancelText: '', okText: 'Done' });
		expect(popup.props('cancelText')).toBe('');
		expect(popup.props('okText')).toBe('Done');
		wrapper.unmount();
	});
});
