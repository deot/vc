// @vitest-environment jsdom

import { mount } from '@vue/test-utils';
import { nextTick, ref } from 'vue';
import { vi } from 'vitest';
import { MDatePicker, MDatePickerView } from '../index.m';
import { MDatePickerCore } from '../mobile/date-picker-core';

const sleep = (ms = 0) => new Promise<void>(r => setTimeout(r, ms));
const flush = async () => {
	await nextTick();
	await sleep(0);
	await nextTick();
};

const emitPickerChange = async (wrapper: any, value: string, index: number) => {
	wrapper.findComponent({ name: 'vcm-picker-view' }).vm.$emit('picker-change', value, index, {
		value,
		label: value
	});
	await flush();
};

const dragCol = async (el: Element, from: number, to: number) => {
	el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, screenY: from }));
	el.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, cancelable: true, screenY: to }));
	el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, screenY: to }));
	await flush();
};

describe('MDatePicker exports', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('exports mobile date picker, view and open helper', () => {
		expect(typeof MDatePicker).toBe('object');
		expect(typeof MDatePickerView).toBe('object');
		expect(MDatePicker.View).toBe(MDatePickerView);
		expect(typeof MDatePicker.open).toBe('function');
	});
});

describe('MDatePicker trigger', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('renders list item trigger and formats label with seconds by default', async () => {
		const wrapper = mount(() => (
			<MDatePicker
				modelValue={new Date(2024, 0, 2, 3, 4, 5)}
				type="datetime"
				label="日期时间"
				labelWidth={120}
				arrow={false}
			/>
		), { attachTo: document.body });
		await flush();

		expect(wrapper.classes()).toContain('vcm-date-picker');
		expect(wrapper.find('.vcm-list-item').exists()).toBe(true);
		expect(wrapper.text()).toContain('日期时间');
		expect(wrapper.text()).toContain('2024-01-02 03:04:05');
		expect(wrapper.find('.vcm-list-item__icon').exists()).toBe(false);
		expect(wrapper.find('.vcm-list-item__wrapper > div').attributes('style')).toContain('width: 120px');

		wrapper.unmount();
	});

	it('renders default slot with formatted label', async () => {
		const wrapper = mount(() => (
			<MDatePicker modelValue={new Date(2024, 0, 2)} type="date">
				{{
					default: ({ label }: any) => <span class="slot-label">{label}</span>
				}}
			</MDatePicker>
		), { attachTo: document.body });
		await flush();

		expect(wrapper.find('.slot-label').text()).toBe('2024-01-02');

		wrapper.unmount();
	});

	it('opens popup from trigger and commits normalized value on ok', async () => {
		const value = ref<any>(new Date(2024, 0, 2, 3, 4, 5));
		const onOk = vi.fn();
		const onChange = vi.fn();
		const onPickerChange = vi.fn();
		const wrapper = mount(() => (
			<MDatePicker
				modelValue={value.value}
				type="datetime"
				onUpdate:modelValue={(v: any) => (value.value = v)}
				onOk={onOk}
				onChange={onChange}
				onPickerChange={onPickerChange}
			/>
		), { attachTo: document.body });
		await flush();

		await wrapper.trigger('click');
		await flush();
		expect(document.querySelector('.vcm-picker-popup')).not.toBeNull();

		await dragCol(document.querySelectorAll('.vcm-picker-col')[5], 0, -40);
		expect(onPickerChange).toHaveBeenCalled();

		(document.querySelector('.vcm-picker-popup__item.is-right') as HTMLElement).click();
		await flush();

		expect(value.value).toMatch(/^2024-01-02 03:04:/);
		expect(onOk).toHaveBeenCalledWith(expect.stringMatching(/^2024-01-02 03:04:/));
		expect(onChange).toHaveBeenCalledWith(expect.stringMatching(/^2024-01-02 03:04:/));

		wrapper.unmount();
	});

	it('emits cancel from trigger popup', async () => {
		const onCancel = vi.fn();
		const wrapper = mount(() => (
			<MDatePicker
				modelValue={new Date(2024, 0, 2)}
				type="date"
				onCancel={onCancel}
			/>
		), { attachTo: document.body });
		await flush();

		await wrapper.trigger('click');
		await flush();
		(document.querySelector('.vcm-picker-popup__item.is-left') as HTMLElement).click();
		await flush();

		expect(onCancel).toHaveBeenCalledTimes(1);

		wrapper.unmount();
	});

	it('open creates a portal popup and calls onOk with formatted value', async () => {
		const onOk = vi.fn();
		const leaf = MDatePicker.open({
			type: 'datetime',
			value: new Date(2024, 0, 2, 3, 4, 5),
			onOk
		});
		await flush();

		expect(document.querySelector('.vcm-picker-popup')).not.toBeNull();
		(document.querySelector('.vcm-picker-popup__item.is-right') as HTMLElement).click();
		await flush();

		expect(onOk).toHaveBeenCalledWith('2024-01-02 03:04:05');

		leaf.destroy();
	});

	it('open without value commits the default normalized value', async () => {
		const onOk = vi.fn();
		const leaf = MDatePicker.open({
			type: 'date',
			onOk
		});
		await flush();

		(document.querySelector('.vcm-picker-popup__item.is-right') as HTMLElement).click();
		await flush();

		expect(onOk).toHaveBeenCalledWith(expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/));

		leaf.destroy();
	});
});

describe('MDatePickerCore branches', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('emits ok/change/close/cancel without callback props', async () => {
		const wrapper = mount(MDatePickerCore, {
			attachTo: document.body,
			props: {
				modelValue: new Date(2024, 0, 2, 3, 4, 5),
				type: 'datetime',
				visible: false
			}
		});
		await flush();

		await wrapper.setProps({ visible: true });
		await flush();
		expect(wrapper.emitted('visible-change')?.at(-1)).toEqual([true]);

		wrapper.findComponent({ name: 'vcm-date-picker-view' }).vm.$emit('picker-change', '06', 5, { value: '06' });
		await flush();
		expect(wrapper.emitted('picker-change')?.[0]).toEqual(['06', 5, { value: '06' }]);

		await wrapper.find('.vcm-picker-popup__item.is-right').trigger('click');
		await flush();
		expect(wrapper.emitted('ok')?.[0]).toEqual(['2024-01-02 03:04:05']);
		expect(wrapper.emitted('change')?.[0]).toEqual(['2024-01-02 03:04:05']);

		await wrapper.findComponent({ name: 'vcm-picker-popup' }).vm.$emit('close');
		await flush();
		expect(wrapper.emitted('close')).toHaveLength(1);
		expect(wrapper.emitted('portal-fulfilled')).toHaveLength(1);

		await wrapper.find('.vcm-picker-popup__item.is-left').trigger('click');
		await flush();
		expect(wrapper.emitted('cancel')).toHaveLength(1);

		wrapper.unmount();
	});
});

describe('MDatePickerView type and format', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('type=datetime uses default seconds format and emits formatted value', async () => {
		const onUpdate = vi.fn();
		const onChange = vi.fn();
		const onPickerChange = vi.fn();
		const wrapper = mount(() => (
			<MDatePickerView
				modelValue={new Date(2024, 0, 2, 3, 4, 5)}
				type="datetime"
				onUpdate:modelValue={onUpdate}
				onChange={onChange}
				onPickerChange={onPickerChange}
			/>
		), { attachTo: document.body });
		await flush();

		expect(wrapper.findAll('.vcm-picker-col')).toHaveLength(6);
		expect(wrapper.text()).toContain('秒');

		await emitPickerChange(wrapper, '16', 5);

		expect(onUpdate).toHaveBeenLastCalledWith('2024-01-02 03:04:16');
		expect(onChange).toHaveBeenLastCalledWith('2024-01-02 03:04:16');
		expect(onPickerChange).toHaveBeenCalledWith('16', 5, expect.objectContaining({ value: '16' }));

		wrapper.unmount();
	});

	it('format without seconds hides second column and emits matching value', async () => {
		const onUpdate = vi.fn();
		const wrapper = mount(() => (
			<MDatePickerView
				modelValue={new Date(2024, 0, 2, 3, 4, 5)}
				type="datetime"
				format="YYYY-MM-DD HH:mm"
				onUpdate:modelValue={onUpdate}
			/>
		), { attachTo: document.body });
		await flush();

		expect(wrapper.findAll('.vcm-picker-col')).toHaveLength(5);
		expect(wrapper.text()).not.toContain('秒');

		await emitPickerChange(wrapper, '09', 4);

		expect(onUpdate).toHaveBeenLastCalledWith('2024-01-02 03:09');

		wrapper.unmount();
	});

	it('type=time follows HH:mm:ss by default', async () => {
		const onUpdate = vi.fn();
		const wrapper = mount(() => (
			<MDatePickerView
				modelValue="08:30:15"
				type="time"
				onUpdate:modelValue={onUpdate}
			/>
		), { attachTo: document.body });
		await flush();

		expect(wrapper.findAll('.vcm-picker-col')).toHaveLength(3);

		await emitPickerChange(wrapper, '20', 2);

		expect(onUpdate).toHaveBeenLastCalledWith('08:30:20');

		wrapper.unmount();
	});

	it('type=quarter emits the PC formatter shape', async () => {
		const onUpdate = vi.fn();
		const wrapper = mount(() => (
			<MDatePickerView
				modelValue={[new Date(2024, 0, 1), new Date(2024, 2, 31)]}
				type="quarter"
				onUpdate:modelValue={onUpdate}
			/>
		), { attachTo: document.body });
		await flush();

		expect(wrapper.findAll('.vcm-picker-col')).toHaveLength(2);

		await emitPickerChange(wrapper, '2', 1);

		expect(onUpdate).toHaveBeenLastCalledWith(['2024-04-01', '2024-06-30']);

		wrapper.unmount();
	});

	it('supports date, yearmonth, year and month type columns', async () => {
		const dateWrapper = mount(() => (
			<MDatePickerView
				modelValue={new Date(2024, 1, 29)}
				type="date"
				minDate={new Date(2024, 0, 1)}
				maxDate={new Date(2024, 11, 31)}
			/>
		), { attachTo: document.body });
		await flush();
		expect(dateWrapper.findAll('.vcm-picker-col')).toHaveLength(3);
		expect(dateWrapper.text()).toContain('29日');
		dateWrapper.unmount();

		const yearmonthWrapper = mount(() => (
			<MDatePickerView
				modelValue={new Date(2024, 5, 1)}
				type="yearmonth"
			/>
		), { attachTo: document.body });
		await flush();
		expect(yearmonthWrapper.findAll('.vcm-picker-col')).toHaveLength(2);
		yearmonthWrapper.unmount();

		const yearWrapper = mount(() => (
			<MDatePickerView
				modelValue={new Date(2024, 0, 1)}
				type="year"
			/>
		), { attachTo: document.body });
		await flush();
		expect(yearWrapper.findAll('.vcm-picker-col')).toHaveLength(1);
		yearWrapper.unmount();

		const monthWrapper = mount(() => (
			<MDatePickerView
				modelValue={new Date(2024, 5, 1)}
				type="month"
			/>
		), { attachTo: document.body });
		await flush();
		expect(monthWrapper.findAll('.vcm-picker-col')).toHaveLength(2);
		monthWrapper.unmount();
	});

	it('reacts when format changes after mount', async () => {
		const wrapper = mount(MDatePickerView, {
			attachTo: document.body,
			props: {
				modelValue: new Date(2024, 0, 2, 3, 4, 5),
				type: 'datetime'
			}
		});
		await flush();
		expect(wrapper.findAll('.vcm-picker-col')).toHaveLength(6);

		await wrapper.setProps({ format: 'YYYY-MM-DD HH:mm' });
		await flush();
		expect(wrapper.findAll('.vcm-picker-col')).toHaveLength(5);

		wrapper.unmount();
	});
});
