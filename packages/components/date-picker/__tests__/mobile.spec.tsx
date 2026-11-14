// @vitest-environment jsdom

import { mount } from '@vue/test-utils';
import { nextTick, ref } from 'vue';
import { vi } from 'vitest';
import { fireMouse } from '../../../hooks/__tests__/fixtures/drag';
import { MDatePicker, MDatePickerView } from '../index.m';
import { MDatePickerCore } from '../mobile/date-picker-core';
import { createContext, formatPoints, isSpanDisabled, parsePoints, resolveColumns, resolvePoints } from '../mobile/utils';

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
	fireMouse(el, 'mousedown', { screenY: from });
	fireMouse(el, 'mousemove', { screenY: to });
	fireMouse(el, 'mouseup', { screenY: to });
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
		expect(wrapper.find('.vcm-list-item__arrow').exists()).toBe(false);
		expect(wrapper.find('.vcm-list-item__wrapper > div').attributes('style')).toContain('width: calc(var(--vc-rem) * 120)');

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

	it('confirm=false：没有按钮，滚轮停下即提交，弹层保持打开', async () => {
		const wrapper = mount(MDatePickerCore, {
			attachTo: document.body,
			props: {
				modelValue: '2024-01-02',
				type: 'date',
				confirm: false
			}
		});
		await flush();
		expect(wrapper.find('.vcm-picker-popup__header').exists()).toBe(false);
		// 打开时不提交
		expect(wrapper.emitted('change')).toBeUndefined();

		await wrapper.findAll('.vcm-picker-col')[2].findAll('.vcm-picker-col__item')[4].trigger('click');
		await flush();
		expect(wrapper.emitted('change')?.at(-1)).toEqual(['2024-01-05']);
		expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['2024-01-05']);
		expect(wrapper.emitted('ok')).toBeUndefined();

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

	it('date、year、month 的列数；不存在的日期不显示', async () => {
		const dateWrapper = mount(() => (
			<MDatePickerView modelValue={new Date(2024, 1, 29)} type="date" />
		), { attachTo: document.body });
		await flush();
		const cols = dateWrapper.findAll('.vcm-picker-col');
		expect(cols).toHaveLength(3);
		expect(dateWrapper.text()).toContain('29日');
		// 2024 年 2 月有 29 天
		expect(cols[2].findAll('.vcm-picker-col__item')).toHaveLength(29);
		dateWrapper.unmount();

		const yearWrapper = mount(() => (
			<MDatePickerView modelValue={new Date(2024, 0, 1)} type="year" />
		), { attachTo: document.body });
		await flush();
		expect(yearWrapper.findAll('.vcm-picker-col')).toHaveLength(1);
		yearWrapper.unmount();

		const monthWrapper = mount(() => (
			<MDatePickerView modelValue={new Date(2024, 5, 1)} type="month" />
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

const selectedTexts = (root: { findAll: (s: string) => any[] }) => {
	return root.findAll('.vcm-picker-col__item.is-selected').map((item: any) => item.text());
};
const disabledTexts = (col: any) => col.findAll('.vcm-picker-col__item.is-disabled').map((item: any) => item.text());

describe('mobile/utils', () => {
	it('createContext：未知 type 回到 datetime，steps 取自 steps 或 timePickerOptions.steps', () => {
		expect(createContext({ type: 'yearmonth' }).type).toBe('datetime');
		expect(createContext({ type: 'time', steps: [2, 5] }).steps).toEqual([2, 5, 1]);
		expect(createContext({ type: 'time', timePickerOptions: { steps: [1, 15, 30] } }).steps).toEqual([1, 15, 30]);
		expect(createContext({ type: 'date' }).yearRange).toEqual([1900, 2100]);
	});

	it('isSpanDisabled：逐天判断，遇到可选日期即停止，结果按 disabledDate 缓存', () => {
		const disabledDate = vi.fn((date: Date) => date.getDate() !== 15);
		const start = new Date(2024, 0, 1);
		const end = new Date(2024, 0, 31, 23, 59, 59);
		expect(isSpanDisabled(start, end, disabledDate)).toBe(false);
		expect(disabledDate).toHaveBeenCalledTimes(15);
		expect(isSpanDisabled(start, end, disabledDate)).toBe(false);
		expect(disabledDate).toHaveBeenCalledTimes(15);
		expect(isSpanDisabled(start, end, () => true)).toBe(true);
	});

	it('值的格式与桌面端相同：单值为字符串，季度与范围为数组', () => {
		const date = new Date(2024, 4, 6, 7, 8, 9);
		const format = (type: string, extra: Record<string, any> = {}) => {
			const ctx = createContext({ type, ...extra });
			return formatPoints(resolvePoints([date, new Date(2024, 7, 1)], ctx), ctx);
		};
		const single = (type: string) => {
			const ctx = createContext({ type });
			return formatPoints(resolvePoints(date, ctx), ctx);
		};
		expect(single('date')).toBe('2024-05-06');
		expect(single('datetime')).toBe('2024-05-06 07:08:09');
		expect(single('month')).toBe('2024-05');
		expect(single('year')).toBe('2024');
		expect(single('time')).toBe('07:08:09');
		expect(single('quarter')).toEqual(['2024-04-01', '2024-06-30']);

		expect(format('daterange')).toEqual(['2024-05-06', '2024-08-01']);
		expect(format('monthrange')).toEqual(['2024-05', '2024-08']);
		expect(format('quarterrange')).toEqual(['2024-04-01', '2024-09-30']);
		expect(format('datetimerange')).toEqual(['2024-05-06 07:08:09', '2024-08-01 00:00:00']);

		// 字符串按 separator 解析
		const ctx = createContext({ type: 'daterange', separator: ' ~ ' });
		expect(parsePoints('2024-01-02 ~ 2024-01-05', ctx).map(d => d.getDate())).toEqual([2, 5]);
		expect(parsePoints('', ctx)).toEqual([]);
		expect(formatPoints([], ctx, null)).toBe(null);
	});

	it('resolvePoints：结束早于开始时取开始值；落在禁用日上时取最近的可选日', () => {
		const range = createContext({ type: 'daterange' });
		const points = resolvePoints([new Date(2024, 0, 10), new Date(2024, 0, 5)], range);
		expect(points.map(d => d.getDate())).toEqual([10, 10]);

		const ctx = createContext({ type: 'date', disabledDate: (d: Date) => d.getDay() === 0 || d.getDay() === 6 });
		// 2024-01-06 为周六：最近的可选日为 01-05（周五）
		expect(resolvePoints(new Date(2024, 0, 6), ctx)[0].getDate()).toBe(5);
	});

	it('resolveColumns：月末校正、步长外的分钟取最近的一档', () => {
		const ctx = createContext({ type: 'datetime', steps: [1, 15] });
		const { values, date } = resolveColumns(ctx, new Date(2023, 1, 28, 10, 38, 20));
		expect(values).toEqual(['2023', '02', '28', '10', '45', '20']);
		expect(date.getMinutes()).toBe(45);
	});
});

describe('MDatePickerView disabledDate / timePickerOptions / yearRange', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('disabledDate：日按天置灰；年、月只在每一天都被禁用时置灰', async () => {
		// 只允许 2024-03-10 ~ 2024-05-20
		const disabledDate = (d: Date) => d < new Date(2024, 2, 10) || d > new Date(2024, 4, 20);
		const wrapper = mount(() => (
			<MDatePickerView modelValue={new Date(2024, 2, 15)} type="date" disabledDate={disabledDate} yearRange={[2023, 2025]} />
		), { attachTo: document.body });
		await flush();

		const cols = wrapper.findAll('.vcm-picker-col');
		expect(disabledTexts(cols[0])).toEqual(['2023年', '2025年']);
		expect(disabledTexts(cols[1])).toEqual(['01月', '02月', '06月', '07月', '08月', '09月', '10月', '11月', '12月']);
		expect(disabledTexts(cols[2])).toEqual(['01日', '02日', '03日', '04日', '05日', '06日', '07日', '08日', '09日']);
		wrapper.unmount();
	});

	it('初始值落在禁用项上：显示最近的可选值，确定时提交校正后的值', async () => {
		const onOk = vi.fn();
		const leaf = MDatePicker.open({
			type: 'date',
			value: '2024-03-01',
			disabledDate: (d: Date) => d < new Date(2024, 2, 10),
			onOk
		});
		await flush();
		const selected = Array.from(document.querySelectorAll('.vcm-picker-col__item.is-selected')).map(el => el.textContent);
		expect(selected).toEqual(['2024年', '03月', '10日']);

		(document.querySelector('.vcm-picker-popup__item.is-right') as HTMLElement).click();
		await flush();
		expect(onOk).toHaveBeenCalledWith('2024-03-10');
		leaf.destroy();
	});

	it('timePickerOptions 与 steps：禁用的时、分置灰，filterable 时隐藏；按步长生成', async () => {
		const wrapper = mount(MDatePickerView, {
			attachTo: document.body,
			props: {
				modelValue: '09:30',
				type: 'time',
				format: 'HH:mm',
				steps: [1, 15],
				timePickerOptions: {
					disabledHours: [0, 1, 2, 3, 4, 5, 6, 7],
					disabledTime: (d: Date) => d.getHours() === 12
				}
			}
		});
		await flush();

		let cols = wrapper.findAll('.vcm-picker-col');
		expect(cols[0].findAll('.vcm-picker-col__item')).toHaveLength(24);
		expect(disabledTexts(cols[0])).toEqual(['00时', '01时', '02时', '03时', '04时', '05时', '06时', '07时', '12时']);
		expect(cols[1].findAll('.vcm-picker-col__item').map(item => item.text())).toEqual(['00分', '15分', '30分', '45分']);

		await wrapper.setProps({ timePickerOptions: { disabledHours: [0, 1, 2, 3, 4, 5, 6, 7], filterable: true } });
		await flush();
		cols = wrapper.findAll('.vcm-picker-col');
		expect(cols[0].findAll('.vcm-picker-col__item')).toHaveLength(16);
		wrapper.unmount();
	});

	it('yearRange：年份列的范围', async () => {
		const wrapper = mount(() => (
			<MDatePickerView modelValue="2020" type="year" yearRange={[2018, 2022]} />
		), { attachTo: document.body });
		await flush();
		expect(wrapper.findAll('.vcm-picker-col__item').map(item => item.text())).toEqual(['2018年', '2019年', '2020年', '2021年', '2022年']);
		wrapper.unmount();
	});
});

describe('MDatePickerView 范围', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('起止栏：点哪一侧就编辑哪一侧，结束一侧早于开始值的项置灰', async () => {
		const value = ref<any>(['2024-03-10', '2024-03-20']);
		const wrapper = mount(() => (
			<MDatePickerView v-model={value.value} type="daterange" yearRange={[2023, 2025]} />
		), { attachTo: document.body });
		await flush();

		const items = wrapper.findAll('.vcm-date-picker-view__range-item');
		expect(items.map(item => item.text())).toEqual(['2024-03-10', '2024-03-20']);
		expect(items[0].classes()).toContain('is-active');
		expect(wrapper.find('.vcm-date-picker-view__separator').text()).toBe('~');
		expect(selectedTexts(wrapper)).toEqual(['2024年', '03月', '10日']);

		await items[1].trigger('click');
		await flush();
		expect(wrapper.findAll('.vcm-date-picker-view__range-item')[1].classes()).toContain('is-active');
		expect(selectedTexts(wrapper)).toEqual(['2024年', '03月', '20日']);
		const cols = wrapper.findAll('.vcm-picker-col');
		expect(disabledTexts(cols[0])).toEqual(['2023年']);
		expect(disabledTexts(cols[1])).toEqual(['01月', '02月']);
		expect(disabledTexts(cols[2])).toHaveLength(9);

		await emitPickerChange(wrapper, '25', 2);
		expect(value.value).toEqual(['2024-03-10', '2024-03-25']);
		wrapper.unmount();
	});

	it('开始值改到结束值之后：结束值跟到开始值', async () => {
		const value = ref<any>(['2024-03-10', '2024-03-20']);
		const wrapper = mount(() => (
			<MDatePickerView v-model={value.value} type="daterange" />
		), { attachTo: document.body });
		await flush();

		await emitPickerChange(wrapper, '04', 1);
		expect(value.value).toEqual(['2024-04-10', '2024-04-10']);
		expect(wrapper.findAll('.vcm-date-picker-view__range-item').map(item => item.text())).toEqual(['2024-04-10', '2024-04-10']);
		wrapper.unmount();
	});

	it('datetimerange 六列、quarterrange 显示季度名、timerange 三列', async () => {
		const datetime = mount(() => (
			<MDatePickerView modelValue={['2024-03-10 08:00:00', '2024-03-10 18:30:00']} type="datetimerange" />
		), { attachTo: document.body });
		await flush();
		expect(datetime.findAll('.vcm-picker-col')).toHaveLength(6);
		datetime.unmount();

		const quarter = mount(() => (
			<MDatePickerView modelValue={['2024-01-01', '2024-06-30']} type="quarterrange" />
		), { attachTo: document.body });
		await flush();
		expect(quarter.findAll('.vcm-date-picker-view__range-item').map(item => item.text())).toEqual(['2024年第一季度', '2024年第二季度']);
		quarter.unmount();

		const time = mount(() => (
			<MDatePickerView modelValue={['08:00:00', '18:00:00']} type="timerange" />
		), { attachTo: document.body });
		await flush();
		expect(time.findAll('.vcm-picker-col')).toHaveLength(3);
		time.unmount();
	});

	it('MDatePicker：触发项用 separator 连接起止；open 没有值时起止都为今天', async () => {
		const wrapper = mount(() => (
			<MDatePicker modelValue={['2024-03-10', '2024-03-20']} type="daterange" separator=" 至 " />
		), { attachTo: document.body });
		await flush();
		expect(wrapper.text()).toContain('2024-03-10 至 2024-03-20');
		wrapper.unmount();

		const onOk = vi.fn();
		const leaf = MDatePicker.open({ type: 'monthrange', onOk });
		await flush();
		expect(document.querySelectorAll('.vcm-date-picker-view__range-item')).toHaveLength(2);
		(document.querySelector('.vcm-picker-popup__item.is-right') as HTMLElement).click();
		await flush();
		const [start, end] = onOk.mock.calls[0][0];
		expect(start).toMatch(/^\d{4}-\d{2}$/);
		expect(end).toBe(start);
		leaf.destroy();
	});
});
