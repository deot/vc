// @vitest-environment jsdom

import { MCalendarPicker, MCalendarPickerView, VcInstance } from '@deot/vc-components';
import { zhCN } from '@deot/vc-locale';
import { mount } from '@vue/test-utils';
import { h, nextTick } from 'vue';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MCalendarPickerCore } from '../mobile/calendar-picker-core';

const sleep = (ms = 0) => new Promise<void>(r => setTimeout(r, ms));
const flush = async () => {
	await nextTick();
	await sleep(0);
	await nextTick();
};

const view = () => document.querySelector('.vcm-calendar-picker-view') as HTMLElement;

describe('MCalendarPicker', () => {
	beforeEach(() => {
		VcInstance.configure({ locale: zhCN });
	});

	afterEach(() => {
		document.body.innerHTML = '';
		vi.restoreAllMocks();
	});

	it('exports', () => {
		expect(typeof MCalendarPicker.open).toBe('function');
		expect(MCalendarPicker.View).toBe(MCalendarPickerView);
	});

	it('trigger: MListItem 显示占位、单值、区间与多选，formatter 优先', async () => {
		const wrapper = mount(() => (
			<div>
				<MCalendarPicker label="日期" />
				<MCalendarPicker modelValue="2024-05-20" />
				<MCalendarPicker type="daterange" modelValue={['2024-05-01', '2024-05-03']} separator=" ~ " />
				<MCalendarPicker multiple modelValue={['2024-05-01', '2024-05-03']} />
				<MCalendarPicker modelValue="2024-05-20" formatter={(v: string) => `日期 ${v}`} />
				<MCalendarPicker extra="请选择日期" />
			</div>
		));
		const extras = wrapper.findAll('.vcm-calendar-picker').map(item => item.text());

		expect(extras[0]).toBe('日期请选择');
		expect(extras.slice(1)).toEqual([
			'2024-05-20',
			'2024-05-01 ~ 2024-05-03',
			'2024-05-01, 2024-05-03',
			'日期 2024-05-20',
			'请选择日期'
		]);

		const wrapper2 = mount(MCalendarPicker, {
			props: { modelValue: '2024-05-20' },
			slots: { default: ({ label, value }: any) => h('span', { class: 'custom' }, `${label}|${value}`) }
		});
		expect(wrapper2.find('.custom').text()).toBe('2024-05-20|2024-05-20');
	});

	it('view: 星期固定在顶部，月份覆盖 yearRange，打开时定位到值所在的月份', async () => {
		const scrollToIndex = vi.fn();
		const wrapper = mount(MCalendarPickerView, {
			props: { modelValue: '2024-03-02', yearRange: [2023, 2025] },
			attachTo: document.body
		});
		(wrapper.findComponent({ name: 'vcm-recycle-list' }).vm as any).scrollToIndex = scrollToIndex;
		const list = wrapper.findComponent({ name: 'vcm-recycle-list' });

		expect(wrapper.classes()).toEqual(expect.arrayContaining(['vc-calendar', 'vcm-calendar', 'vcm-calendar-picker-view']));
		expect(wrapper.findAll('.vc-calendar__weekday')).toHaveLength(7);
		expect(list.props('data')).toHaveLength(36);
		expect((list.props('estimateSize') as any)({ row: (list.props('data') as any[])[14] })).toBe(88 + 6 * 120);
		expect(wrapper.find('.vcm-calendar-picker-view__title').text()).toBe('2024年3月');

		(wrapper.vm as any).scrollToDate(new Date(2030, 5, 1));
		await nextTick();
		expect(wrapper.find('.vcm-calendar-picker-view__title').text()).toBe('2025年12月');
		(wrapper.vm as any).scrollToDate(new Date(2000, 5, 1));
		await nextTick();
		expect(wrapper.find('.vcm-calendar-picker-view__title').text()).toBe('2023年1月');
	});

	it('core: 区间两次点选（反向交换）后确定；confirm 为 false 时选完即提交', async () => {
		const wrapper = mount(MCalendarPickerCore, {
			props: { type: 'daterange', modelValue: [], confirm: 'bottom' },
			attachTo: document.body
		});
		await flush();
		const viewWrapper = wrapper.findComponent(MCalendarPickerView);

		viewWrapper.vm.$emit('update:modelValue', ['2024-05-10', '2024-05-20']);
		await flush();
		expect(wrapper.emitted('ok')).toBeUndefined();

		(document.querySelector('.vcm-picker-popup__button') as HTMLElement).click();
		await flush();
		expect(wrapper.emitted('ok')![0]).toEqual([['2024-05-10', '2024-05-20']]);
		expect(wrapper.emitted('update:modelValue')![0]).toEqual([['2024-05-10', '2024-05-20']]);

		const wrapper2 = mount(MCalendarPickerCore, { props: { confirm: false }, attachTo: document.body });
		await flush();
		wrapper2.findComponent(MCalendarPickerView).vm.$emit('update:modelValue', '2024-05-01');
		await flush();
		expect(wrapper2.emitted('ok')![0]).toEqual(['2024-05-01']);

		// 多选不需要确认时：每次点选提交，弹层保持打开
		const wrapper3 = mount(MCalendarPickerCore, { props: { confirm: false, multiple: true }, attachTo: document.body });
		await flush();
		wrapper3.findComponent(MCalendarPickerView).vm.$emit('update:modelValue', ['2024-05-01']);
		await flush();
		expect(wrapper3.emitted('ok')).toBeUndefined();
		expect(wrapper3.emitted('change')![0]).toEqual([['2024-05-01']]);
	});

	it('open: 确定时调用 onOk，插槽经 Portal 传入', async () => {
		const onOk = vi.fn();
		const content = vi.fn(() => h('i', { class: 'custom-content' }));
		const leaf = MCalendarPicker.open({ value: '2024-05-20', onOk, slots: { content } });
		await flush();

		expect(view()).not.toBeNull();
		expect(document.querySelector('.vcm-calendar-picker-popup .vcm-popup__title, .vcm-calendar-picker-popup')?.textContent).toContain('选择日期');
		(document.querySelector('.vcm-picker-popup__button') as HTMLElement).click();
		await flush();
		expect(onOk).toHaveBeenCalledWith('2024-05-20');
		leaf.destroy();

		const onCancel = vi.fn();
		const leaf2 = MCalendarPicker.open({ confirm: true, onCancel });
		await flush();
		(document.querySelector('.vcm-picker-popup__item.is-left') as HTMLElement).click();
		await flush();
		expect(onCancel).toHaveBeenCalled();
		leaf2.destroy();
	});

	it('受控更新、date-click 转发与滚动时切换浮动标题', async () => {
		const trigger = mount(MCalendarPicker, { props: { modelValue: '' } });
		await trigger.setProps({ modelValue: '2024-06-01' });
		expect(trigger.text()).toBe('2024-06-01');

		const core = mount(MCalendarPickerCore, { props: { modelValue: '' }, attachTo: document.body });
		await flush();
		await core.setProps({ modelValue: '2024-06-02' });
		const viewWrapper = core.findComponent(MCalendarPickerView);
		expect(viewWrapper.props('modelValue')).toBe('2024-06-02');
		viewWrapper.vm.$emit('date-click', { value: '2024-06-03' });
		expect(core.emitted('date-click')![0]).toEqual([{ value: '2024-06-03' }]);

		const wrapper = mount(MCalendarPickerView, { props: { yearRange: [2024, 2024], modelValue: '2024-01-05' }, attachTo: document.body });
		const stage = wrapper.find('.vcm-calendar-picker-view__stage').element as HTMLElement;
		const item = document.createElement('div');
		item.dataset.index = '4';
		stage.appendChild(item);
		vi.spyOn(stage, 'getBoundingClientRect').mockReturnValue({ top: 100 } as DOMRect);
		vi.spyOn(item, 'getBoundingClientRect').mockReturnValue({ top: 50, bottom: 300 } as DOMRect);
		vi.spyOn(window, 'requestAnimationFrame').mockImplementation((fn: any) => (fn(0), 0));

		wrapper.findComponent({ name: 'vcm-recycle-list' }).vm.$emit('scroll', {});
		await nextTick();
		expect(wrapper.find('.vcm-calendar-picker-view__title').text()).toBe('2024年5月');
		wrapper.unmount();
	});

	it('trigger: 打开弹层，确定后写回并通知表单', async () => {
		const wrapper = mount(MCalendarPicker, {
			props: { modelValue: '2024-05-20', title: '选择' },
			attachTo: document.body
		});

		await wrapper.trigger('click');
		await flush();
		expect(document.querySelector('.vcm-calendar-picker-popup')?.textContent).toContain('选择');

		(document.querySelector('.vcm-picker-popup__button') as HTMLElement).click();
		await flush();
		expect(wrapper.emitted('ok')![0]).toEqual(['2024-05-20']);
		expect(wrapper.emitted('update:modelValue')![0]).toEqual(['2024-05-20']);
		wrapper.unmount();
	});
});
