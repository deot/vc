// @vitest-environment jsdom

import { Calendar } from '@deot/vc-components';
import { mount } from '@vue/test-utils';
import { h, nextTick } from 'vue';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getMonthData, getWeek } from '../utils';
import date2holiday from '../date2holiday';

describe('index.ts', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2024-05-15T12:00:00'));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('basic', () => {
		expect(typeof Calendar).toBe('object');
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

	it('lang="en": 渲染英文月份和星期', () => {
		const wrapper = mount(() => (<Calendar lang="en" />));

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
		const wrapper = mount(() => (
			<Calendar
				renderMonth={({ year, monthNames }) => <div class="custom-month">{`${year}-${monthNames[4].en}`}</div>}
				renderWeek={({ weekNames }) => <div class="custom-week">{weekNames.map(i => i.en).join(',')}</div>}
				renderDate={({ cell, today }) => (
					<span class="custom-date">
						{cell.value === today ? `today-${cell.date}` : cell.date}
					</span>
				)}
			/>
		));

		expect(wrapper.find('.custom-month').text()).toBe('2024-May');
		expect(wrapper.find('.custom-week').text()).toContain('Sun');
		expect(wrapper.findAll('.custom-date')).toHaveLength(42);
		expect(wrapper.find('.custom-date').exists()).toBe(true);
		expect(wrapper.text()).toContain('today-15');
	});

	it('slots: month/week/default 接收正确数据', () => {
		const wrapper = mount(Calendar, {
			slots: {
				month: ({ data }) => h('div', { class: 'month-slot' }, `${data.month}-${data.year}`),
				week: ({ data }) => h('div', { class: 'week-slot' }, data.join('|')),
				default: ({ cell, holiday }) => h('span', { class: 'date-slot' }, `${cell.value}:${holiday.holiday || ''}`)
			}
		});

		expect(wrapper.find('.month-slot').text()).toBe('五月-2024');
		expect(wrapper.find('.week-slot').text()).toContain('一|二|三');
		expect(wrapper.findAll('.date-slot')).toHaveLength(42);
		expect(wrapper.find('.date-slot').text()).toContain('2024-');
	});

	it('date2holiday: 返回节假日信息', () => {
		expect(date2holiday('2024-10-01').holiday).toBe('国庆节');
	});
});
