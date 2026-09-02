// @vitest-environment jsdom

import { Calendar, VcInstance } from '@deot/vc-components';
import { enUS, zhCN } from '@deot/vc-locale';
import { mount } from '@vue/test-utils';
import { h, nextTick } from 'vue';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getMonthData, getWeek } from '../utils';
import { Date2Holiday } from '../date2holiday';

describe('index.ts', () => {
	beforeEach(() => {
		VcInstance.configure({ locale: zhCN });
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2024-05-15T12:00:00'));
	});

	afterEach(() => {
		VcInstance.configure({ locale: zhCN });
		vi.useRealTimers();
	});

	it('basic', () => {
		expect(typeof Calendar).toBe('object');
		expect(Calendar.props).not.toHaveProperty('lang');
		expect(Calendar.props).not.toHaveProperty('monthNames');
		expect(Calendar.props).not.toHaveProperty('weekNames');
	});

	it('create: 渲染默认月、星期和 42 个日期', () => {
		const wrapper = mount(() => (<Calendar />));

		expect(wrapper.classes()).toContain('vc-calendar');
		expect(wrapper.find('.vc-calendar__month').text()).toContain('五月');
		expect(wrapper.find('.vc-calendar__month').text()).toContain('2024');
		expect(wrapper.findAll('.vc-calendar__week span')).toHaveLength(7);
		expect(wrapper.findAll('.vc-calendar__week span').map(i => i.text())).toEqual(['一', '二', '三', '四', '五', '六', '日']);
		expect(wrapper.findAll('.vc-calendar-row')).toHaveLength(6);
		expect(wrapper.findAll('.vc-calendar-row__item')).toHaveLength(42);
		expect(wrapper.findAll('.vc-calendar-row__item').slice(0, 7).map(i => i.text())).toEqual(['29', '30', '1', '2', '3', '4', '5']);
		expect(wrapper.find('.is-selected').text()).toBe('15');
	});

	it('prev/next: 支持普通月份和跨年切换', async () => {
		const wrapper = mount(Calendar);
		const vm = wrapper.vm as any;

		vm.prev();
		await nextTick();
		expect(wrapper.find('.vc-calendar__month').text()).toContain('四月');
		expect(wrapper.find('.vc-calendar__month').text()).toContain('2024');

		vm.next();
		await nextTick();
		expect(wrapper.find('.vc-calendar__month').text()).toContain('五月');
		expect(wrapper.find('.vc-calendar__month').text()).toContain('2024');

		vi.setSystemTime(new Date('2024-01-15T12:00:00'));
		const wrapper2 = mount(Calendar);
		const vm2 = wrapper2.vm as any;

		vm2.prev();
		await nextTick();
		expect(wrapper2.find('.vc-calendar__month').text()).toContain('十二月');
		expect(wrapper2.find('.vc-calendar__month').text()).toContain('2023');
	});

	it('utils: 获取月份数据和星期', () => {
		expect(getMonthData(2019, 0).month).toBe(12);
		expect(getMonthData(2019, 12).month).toBe(12);
		expect(getMonthData(2019, 8).month).toBe(8);
		expect(getMonthData(2019, 13).month).toBe(1);
		expect(getMonthData(2024, 5).data).toHaveLength(42);
		expect(getMonthData(2024, 5).data[0].value).toBe('2024-04-29');
		expect(getMonthData(2024, 5, 7).data[0].value).toBe('2024-04-28');
		expect(getWeek('2024-05-15')).toBe(3);
		expect(getWeek()).toBe(new Date().getDay());
	});

	it('locale: 响应式渲染当前语言的月份和星期', async () => {
		const wrapper = mount(() => (<Calendar />));

		expect(wrapper.find('.vc-calendar__month').text()).toContain('五月');

		VcInstance.configure({ locale: enUS });
		await nextTick();

		expect(wrapper.find('.vc-calendar__month').text()).toContain('May');
		expect(wrapper.findAll('.vc-calendar__week span').map(i => i.text())).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
	});

	it('firstDayOfWeek: 支持周日作为第一列', () => {
		const wrapper = mount(() => (<Calendar firstDayOfWeek={7} />));

		expect(wrapper.findAll('.vc-calendar__week span').map(i => i.text())).toEqual(['日', '一', '二', '三', '四', '五', '六']);
		expect(wrapper.findAll('.vc-calendar-row__item').slice(0, 7).map(i => i.text())).toEqual(['28', '29', '30', '1', '2', '3', '4']);
	});

	it('showAdjacentWeeks: 支持隐藏整周非本月行', () => {
		vi.setSystemTime(new Date('2021-02-15T12:00:00'));
		const wrapper = mount(() => (<Calendar showAdjacentWeeks={false} />));
		const wrapper2 = mount(() => (<Calendar showAdjacentWeeks={[false, true]} />));

		expect(wrapper.findAll('.vc-calendar-row')).toHaveLength(4);
		expect(wrapper.findAll('.vc-calendar-row__item')).toHaveLength(28);
		expect(wrapper.findAll('.vc-calendar-row').at(0)?.text()).toBe('1234567');
		expect(wrapper.findAll('.vc-calendar-row').at(3)?.text()).toBe('22232425262728');
		expect(wrapper2.findAll('.vc-calendar-row')).toHaveLength(6);
		expect(wrapper2.findAll('.vc-calendar-row').at(5)?.text()).toBe('891011121314');
	});

	it('render props: 自定义月、星期和日期渲染', () => {
		const renderMonth = vi.fn(({ data, lang }) => <div class="custom-month">{`${data.year}-${data.month}-${lang}`}</div>);
		const renderWeek = vi.fn(({ data, lang }) => <div class="custom-week">{`${lang}:${data.join(',')}`}</div>);
		const wrapper = mount(() => (
			<Calendar
				renderMonth={renderMonth}
				renderWeek={renderWeek}
				renderDate={({ cell, today }) => (
					<span class="custom-date">
						{cell.value === today ? `today-${cell.date}` : cell.date}
					</span>
				)}
			/>
		));

		expect(wrapper.find('.custom-month').text()).toBe('2024-五月-zh-CN');
		expect(wrapper.find('.custom-week').text()).toBe('zh-CN:一,二,三,四,五,六,日');
		expect(wrapper.findAll('.custom-date')).toHaveLength(42);
		expect(wrapper.find('.custom-date').exists()).toBe(true);
		expect(wrapper.text()).toContain('today-15');
		expect(Object.keys(renderMonth.mock.calls[0][0])).toEqual(['data', 'month', 'year', 'lang']);
		expect(Object.keys(renderWeek.mock.calls[0][0])).toEqual(['data', 'date', 'lang', 'firstDayOfWeek']);
		expect(renderWeek.mock.calls[0][0].date).toBe(renderWeek.mock.calls[0][0].data);
	});

	it('slots: month/week/default 接收正确数据', () => {
		const wrapper = mount(Calendar, {
			slots: {
				month: ({ data, lang }) => h('div', { class: 'month-slot' }, `${data.month}-${data.year}-${lang}`),
				week: ({ data, lang }) => h('div', { class: 'week-slot' }, `${lang}:${data.join('|')}`),
				default: ({ cell, holiday }) => h('span', { class: 'date-slot' }, `${cell.value}:${holiday.holiday || ''}`)
			}
		});

		expect(wrapper.find('.month-slot').text()).toBe('五月-2024-zh-CN');
		expect(wrapper.find('.week-slot').text()).toContain('zh-CN:一|二|三');
		expect(wrapper.findAll('.date-slot')).toHaveLength(42);
		expect(wrapper.find('.date-slot').text()).toContain('2024-');
	});

	it('Date2Holiday: 返回公历、农历和节气信息', () => {
		const lunarNewYear = Date2Holiday.get('1900-01-31', 'zh-CN');

		expect([lunarNewYear.lunarYear, lunarNewYear.lunarMonth, lunarNewYear.lunarDate]).toEqual([1900, 1, 1]);
		expect(Date2Holiday.get('1948-10-01', 'zh-CN').holiday).toBe('');
		expect(Date2Holiday.get('1949-10-01', 'zh-CN').holiday).toBe('国庆节');
		expect(Date2Holiday.get('2024-02-09', 'zh-CN').holiday).toBe('除夕');
		expect(Date2Holiday.get('2024-02-10', 'zh-CN').holiday).toBe('春节');
		expect(Date2Holiday.get('2024-04-04', 'zh-CN').holiday).toBe('清明');
	});

	it('Date2Holiday: 保持节日优先级并支持星期节日', () => {
		const mothersDay = Date2Holiday.get('2024-05-12', 'zh-CN');

		expect(mothersDay.holiday).toBe('母亲节');
		expect(mothersDay.festivals.map(item => item.value)).toEqual(['母亲节', '护士节']);
		expect(Date2Holiday.get('2020-10-01', 'zh-CN').holiday).toBe('中秋节');
		expect(Date2Holiday.get('2024-11-28', 'zh-CN').holiday).toBe('感恩节');
		expect(Date2Holiday.get('1978-03-12', 'zh-CN').holiday).toBe('');
		expect(Date2Holiday.get('1979-03-12', 'zh-CN').holiday).toBe('植树节');
	});

	it('Date2Holiday: 非中文、无效或越界日期返回空结果', () => {
		const empty = {
			holiday: '',
			festivals: []
		};

		expect(Date2Holiday.get('2024-10-01', 'en-US')).toEqual(empty);
		expect(Date2Holiday.get('invalid', 'zh-CN')).toEqual(empty);
		expect(Date2Holiday.get('2024-02-30', 'zh-CN')).toEqual(empty);
		expect(Date2Holiday.get('1899-12-31', 'zh-CN')).toEqual(empty);
		expect(Date2Holiday.get('2101-01-01', 'zh-CN')).toEqual(empty);
		expect(Date2Holiday.get('1900-01-01', 'zh-CN').holiday).toBe('元旦');
		expect(Date2Holiday.get('2100-12-31', 'zh-CN').lunarYear).toBe(2100);
	});
});
