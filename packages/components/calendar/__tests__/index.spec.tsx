// @vitest-environment jsdom

import { Calendar, MCalendar, MScroller, VcInstance } from '@deot/vc-components';
import { enUS, zhCN } from '@deot/vc-locale';
import { mount } from '@vue/test-utils';
import { defineComponent, h, nextTick } from 'vue';
import { CalendarMonth } from '../calendar-month';
import { useCalendarSelection } from '../use-calendar-selection';
import { selectionProps } from '../calendar-props';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getCalendarDates, getLeadingDays } from '../../date-picker/helper/utils';
import { Date2Holiday } from '../date2holiday';

const texts = (wrapper: any, selector: string) => wrapper.findAll(selector).map((item: any) => item.text());
const cell = (wrapper: any, value: string) => wrapper.find(`[data-time="${new Date(`${value}T00:00:00`).getTime()}"]`);
const dayTexts = (wrapper: any, start = 0, end = 7) => {
	return wrapper.findAll('.vc-calendar__cell .vc-calendar__day').slice(start, end).map((item: any) => item.text());
};

describe('index.ts', () => {
	beforeEach(() => {
		VcInstance.configure({ locale: zhCN });
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2024-05-15T12:00:00'));
	});

	afterEach(() => {
		VcInstance.configure({ locale: zhCN, Calendar: { firstDayOfWeek: undefined } });
		vi.useRealTimers();
		vi.restoreAllMocks();
	});

	it('basic', () => {
		expect(typeof Calendar).toBe('object');
		expect(typeof MCalendar).toBe('object');
		expect(Calendar.props).not.toHaveProperty('lang');
		expect(Calendar.props).not.toHaveProperty('renderDate');
		expect(Calendar.props).not.toHaveProperty('renderMonth');
		expect(Calendar.props).not.toHaveProperty('renderWeek');
	});

	it('create: 头部、星期与 42 个日期，今天描边而不是选中', () => {
		const wrapper = mount(() => (<Calendar />));

		expect(wrapper.classes()).toContain('vc-calendar');
		expect(wrapper.classes()).not.toContain('vcm-calendar');
		expect(wrapper.find('.vc-calendar__title').text()).toBe('2024年5月');
		expect(texts(wrapper, '.vc-calendar__weekday')).toEqual(['日', '一', '二', '三', '四', '五', '六']);
		expect(wrapper.findAll('.vc-calendar__row')).toHaveLength(6);
		expect(wrapper.findAll('.vc-calendar__cell')).toHaveLength(42);
		expect(dayTexts(wrapper)).toEqual(['28', '29', '30', '1', '2', '3', '4']);
		expect(wrapper.find('.is-today .vc-calendar__day').text()).toBe('15');
		expect(wrapper.find('.is-selected').exists()).toBe(false);
		expect(wrapper.find('.vc-calendar__cell').classes()).toContain('is-previous');
		expect(wrapper.find('.vc-calendar__today').text()).toBe('今天');
	});

	it('previous/next: 方法、箭头与跨年，发出 update:panelDate', async () => {
		const wrapper = mount(Calendar);
		const vm = wrapper.vm as any;

		vm.previous();
		await nextTick();
		expect(wrapper.find('.vc-calendar__title').text()).toBe('2024年4月');
		expect((wrapper.emitted('update:panelDate')![0][0] as Date).getMonth()).toBe(3);

		await wrapper.find('.vc-calendar__arrow.is-next').trigger('click');
		await wrapper.find('.vc-calendar__arrow.is-next').trigger('click');
		expect(wrapper.find('.vc-calendar__title').text()).toBe('2024年6月');

		await wrapper.find('.vc-calendar__today').trigger('click');
		expect(wrapper.find('.vc-calendar__title').text()).toBe('2024年5月');

		const wrapper2 = mount(Calendar, { props: { panelDate: new Date(2024, 0, 1) } });
		(wrapper2.vm as any).previous();
		await nextTick();
		expect(wrapper2.find('.vc-calendar__title').text()).toBe('2023年12月');
	});

	it('yearRange: 范围外的日期禁用，翻页到边界停住', async () => {
		const wrapper = mount(Calendar, { props: { yearRange: [2024, 2024], panelDate: new Date(2024, 0, 10) } });

		expect(wrapper.find('.vc-calendar__arrow.is-previous').classes()).toContain('is-disabled');
		expect(cell(wrapper, '2023-12-31').classes()).toContain('is-disabled');

		await wrapper.find('.vc-calendar__arrow.is-previous').trigger('click');
		expect(wrapper.find('.vc-calendar__title').text()).toBe('2024年1月');
		expect(wrapper.emitted('update:panelDate')).toBeUndefined();

		await cell(wrapper, '2023-12-31').trigger('click');
		expect(wrapper.emitted('update:modelValue')).toBeUndefined();
		expect(wrapper.emitted('date-click')).toBeUndefined();
	});

	it('locale: 响应式渲染当前语言的标题和星期', async () => {
		const wrapper = mount(() => (<Calendar />));

		VcInstance.configure({ locale: enUS });
		await nextTick();

		expect(wrapper.find('.vc-calendar__title').text()).toBe('May 2024');
		expect(wrapper.find('.vc-calendar__today').text()).toBe('Today');
		expect(texts(wrapper, '.vc-calendar__weekday')).toEqual(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
	});

	it('firstDayOfWeek: 默认周日，支持周一作为第一列', () => {
		const wrapper = mount(() => (<Calendar firstDayOfWeek={1} />));

		expect(texts(wrapper, '.vc-calendar__weekday')).toEqual(['一', '二', '三', '四', '五', '六', '日']);
		expect(dayTexts(wrapper)).toEqual(['29', '30', '1', '2', '3', '4', '5']);
	});

	it('firstDayOfWeek: 全局 Calendar.firstDayOfWeek 生效、响应式更新，prop 优先', async () => {
		VcInstance.configure({ Calendar: { firstDayOfWeek: 1 } });
		const wrapper = mount(Calendar, {
			slots: {
				week: ({ weekdays }: any) => h('div', { class: 'custom-week' }, weekdays.join(','))
			}
		});
		const wrapper2 = mount(() => (<Calendar firstDayOfWeek={3} />));

		expect(wrapper.find('.custom-week').text()).toBe('一,二,三,四,五,六,日');
		expect(dayTexts(wrapper)).toEqual(['29', '30', '1', '2', '3', '4', '5']);
		expect(texts(wrapper2, '.vc-calendar__weekday')).toEqual(['三', '四', '五', '六', '日', '一', '二']);
		// 2024-05-01 是周三，正好是第一天时不补上月
		expect(dayTexts(wrapper2, 0, 1)).toEqual(['1']);

		VcInstance.configure({ Calendar: { firstDayOfWeek: 6 } });
		await nextTick();
		expect(wrapper.find('.custom-week').text()).toBe('六,日,一,二,三,四,五');
		expect(dayTexts(wrapper)).toEqual(['27', '28', '29', '30', '1', '2', '3']);
		expect(texts(wrapper2, '.vc-calendar__weekday')[0]).toBe('三');
	});

	it('showAdjacentWeeks: 支持隐藏整周非本月行', () => {
		vi.setSystemTime(new Date('2021-02-15T12:00:00'));
		const wrapper = mount(() => (<Calendar firstDayOfWeek={1} showAdjacentWeeks={false} />));
		const wrapper2 = mount(() => (<Calendar firstDayOfWeek={1} showAdjacentWeeks={[false, true]} />));

		expect(wrapper.findAll('.vc-calendar__row')).toHaveLength(4);
		expect(wrapper.findAll('.vc-calendar__cell')).toHaveLength(28);
		expect(wrapper.findAll('.vc-calendar__row').at(0)?.text()).toBe('1234567');
		expect(wrapper.findAll('.vc-calendar__row').at(3)?.text()).toBe('22232425262728');
		expect(wrapper2.findAll('.vc-calendar__row')).toHaveLength(6);
		expect(wrapper2.findAll('.vc-calendar__row').at(5)?.text()).toBe('891011121314');
	});

	it('v-model: 单选按 format 输出，点到相邻月份的日期时切到该月', async () => {
		const wrapper = mount(Calendar, { props: { format: 'YYYY/MM/DD' } });

		await cell(wrapper, '2024-05-20').trigger('click');
		expect(wrapper.emitted('update:modelValue')![0]).toEqual(['2024/05/20']);
		expect(wrapper.emitted('change')![0]).toEqual(['2024/05/20']);
		expect(wrapper.emitted('date-click')![0][0]).toEqual({ date: new Date(2024, 4, 20), value: '2024/05/20' });
		expect(cell(wrapper, '2024-05-20').classes()).toContain('is-selected');

		await cell(wrapper, '2024-04-28').trigger('click');
		expect(wrapper.emitted('update:modelValue')![1]).toEqual(['2024/04/28']);
		expect(wrapper.find('.vc-calendar__title').text()).toBe('2024年4月');

		const wrapper2 = mount(Calendar, { props: { modelValue: '2023-02-03' } });
		expect(wrapper2.find('.vc-calendar__title').text()).toBe('2023年2月');
		expect(cell(wrapper2, '2023-02-03').classes()).toContain('is-selected');
	});

	it('daterange: 先起点后终点，反向时交换；选择中悬停预览', async () => {
		const wrapper = mount(Calendar, { props: { type: 'daterange' } });

		await cell(wrapper, '2024-05-20').trigger('click');
		expect(wrapper.emitted('update:modelValue')).toBeUndefined();
		expect(cell(wrapper, '2024-05-20').classes()).toContain('is-selected');

		await cell(wrapper, '2024-05-12').trigger('mouseover');
		expect(cell(wrapper, '2024-05-15').classes()).toContain('is-range');
		expect(cell(wrapper, '2024-05-12').classes()).toContain('is-start');

		await cell(wrapper, '2024-05-10').trigger('click');
		expect(wrapper.emitted('update:modelValue')![0]).toEqual([['2024-05-10', '2024-05-20']]);
		expect(cell(wrapper, '2024-05-10').classes()).toEqual(expect.arrayContaining(['is-start', 'is-selected', 'is-range']));
		expect(cell(wrapper, '2024-05-20').classes()).toContain('is-end');
		expect(cell(wrapper, '2024-05-21').classes()).not.toContain('is-range');
	});

	it('multiple: 再次点选取消', async () => {
		const wrapper = mount(Calendar, { props: { multiple: true, modelValue: ['2024-05-01'] } });

		await cell(wrapper, '2024-05-02').trigger('click');
		expect(wrapper.emitted('update:modelValue')![0]).toEqual([['2024-05-01', '2024-05-02']]);

		await cell(wrapper, '2024-05-01').trigger('click');
		expect(wrapper.emitted('update:modelValue')![1]).toEqual([['2024-05-02']]);
	});

	it('disabledDate / readonly: 禁用不可点，只读只发 date-click', async () => {
		const wrapper = mount(Calendar, { props: { disabledDate: (date: Date) => date.getDate() === 20 } });

		expect(cell(wrapper, '2024-05-20').classes()).toContain('is-disabled');
		await cell(wrapper, '2024-05-20').trigger('click');
		expect(wrapper.emitted('update:modelValue')).toBeUndefined();

		const wrapper2 = mount(Calendar, { props: { readonly: true } });
		expect(wrapper2.classes()).toContain('is-readonly');
		await cell(wrapper2, '2024-05-21').trigger('click');
		expect(wrapper2.emitted('date-click')![0][0]).toEqual({ date: new Date(2024, 4, 21), value: '2024-05-21' });
		expect(wrapper2.emitted('update:modelValue')).toBeUndefined();
		expect(wrapper2.find('.is-selected').exists()).toBe(false);
	});

	it('mode: 点标题切到年视图，点某个月回到月视图', async () => {
		const wrapper = mount(Calendar);

		await wrapper.find('.vc-calendar__title').trigger('click');
		expect(wrapper.emitted('update:mode')![0]).toEqual(['year']);
		expect(wrapper.classes()).toContain('is-year');
		expect(wrapper.find('.vc-calendar__title').text()).toBe('2024年');
		expect(wrapper.findAll('.vc-calendar__year-item')).toHaveLength(12);
		expect(wrapper.find('.vc-calendar__month.is-mini').exists()).toBe(true);
		expect(wrapper.find('.vc-calendar__year-item .is-today').text()).toBe('15');

		(wrapper.vm as any).next();
		await nextTick();
		expect(wrapper.find('.vc-calendar__title').text()).toBe('2025年');

		await wrapper.findAll('.vc-calendar__year-item')[2].trigger('click');
		expect(wrapper.emitted('update:mode')![1]).toEqual(['month']);
		expect(wrapper.find('.vc-calendar__title').text()).toBe('2025年3月');

		const wrapper2 = mount(Calendar, { props: { mode: 'year' } });
		expect(wrapper2.findAll('.vc-calendar__year-item')).toHaveLength(12);
	});

	it('slots: header / content / cell 的参数', async () => {
		const header = vi.fn((props: any) => h('div', { class: 'custom-header' }, props.title));
		const content = vi.fn(({ value }: any) => h('i', { class: 'custom-content' }, value));
		const wrapper = mount(Calendar, { props: { modelValue: '2024-05-20' }, slots: { header, content } });

		expect(wrapper.find('.custom-header').text()).toBe('2024年5月');
		expect(Object.keys(header.mock.calls[0][0])).toEqual(['year', 'month', 'mode', 'title', 'previous', 'next', 'today', 'setMode']);
		expect(wrapper.findAll('.vc-calendar__content')).toHaveLength(42);
		expect(wrapper.find('.vc-calendar__day').exists()).toBe(true);

		const selected = content.mock.calls.find(([item]) => item.value === '2024-05-20')![0];
		expect(selected).toMatchObject({ day: 20, type: 'current', today: false, selected: true, disabled: false });
		expect(selected.date).toEqual(new Date(2024, 4, 20));

		const wrapper2 = mount(Calendar, { slots: { cell: ({ day }: any) => h('b', { class: 'custom-cell' }, day) } });
		expect(wrapper2.findAll('.custom-cell')).toHaveLength(42);
		expect(wrapper2.find('.vc-calendar__day').exists()).toBe(false);
	});

	it('holiday: 读取时才计算，字段完整', () => {
		vi.setSystemTime(new Date('2024-02-10T12:00:00'));
		const spy = vi.spyOn(Date2Holiday, 'get');
		const content = vi.fn(() => null);
		mount(Calendar, { slots: { content } });

		expect(content).toHaveBeenCalled();
		expect(spy).not.toHaveBeenCalled();

		const { holiday } = (content.mock.calls as any[]).find(([item]) => item.value === '2024-02-10')![0];
		expect(holiday).toEqual({
			animal: '龙',
			ganzhiDate: expect.any(String),
			ganzhiMonth: expect.any(String),
			ganzhiYear: '甲辰',
			lunarYear: 2024,
			lunarMonth: 1,
			lunarDate: 1,
			lunarMonthText: '正',
			lunarDateText: '初一',
			solarTerm: '',
			festivals: [{ type: 't', description: '春节', value: '春节' }],
			isBigMonth: false,
			originalDate: new Date(2024, 1, 10),
			weekDay: 6,
			chineseWeekDay: '六',
			holiday: '春节'
		});
		expect(spy).toHaveBeenCalledTimes(1);
	});

	it('lunar: 节日 > 节气 > 农历日，初一显示月名；非中文不显示', async () => {
		vi.setSystemTime(new Date('2024-04-15T12:00:00'));
		const wrapper = mount(Calendar, { props: { lunar: true } });
		const lunar = (value: string) => cell(wrapper, value).find('.vc-calendar__lunar');

		expect(lunar('2024-04-04').text()).toBe('清明');
		expect(lunar('2024-04-04').classes()).toContain('is-highlight');
		expect(lunar('2024-05-01').text()).toBe('劳动节');
		expect(lunar('2024-05-08').text()).toBe('四月');
		expect(lunar('2024-05-08').classes()).not.toContain('is-highlight');
		expect(lunar('2024-04-15').text()).toBe('初七');

		const spy = vi.spyOn(Date2Holiday, 'get');
		await cell(wrapper, '2024-04-16').trigger('click');
		// 选中变化不重算农历
		expect(spy).not.toHaveBeenCalled();

		VcInstance.configure({ locale: enUS });
		await nextTick();
		expect(wrapper.find('.vc-calendar__lunar').exists()).toBe(false);
	});

	it('MCalendar: 标记类与左右滑动翻页', async () => {
		const wrapper = mount(MCalendar);
		const body = wrapper.find('.vc-calendar__body');
		const touch = (type: string, clientX: number, clientY = 0) => {
			const point = { identifier: 1, clientX, clientY, screenX: clientX, screenY: clientY };
			return body.trigger(type, { touches: type === 'touchend' ? [] : [point], changedTouches: [point] });
		};

		expect(wrapper.classes()).toEqual(expect.arrayContaining(['vc-calendar', 'vcm-calendar']));
		expect(wrapper.find('.vcm-button').exists()).toBe(true);

		await touch('touchstart', 200);
		await touch('touchend', 100);
		expect(wrapper.find('.vc-calendar__title').text()).toBe('2024年6月');

		await touch('touchstart', 100);
		await touch('touchend', 300, 10);
		expect(wrapper.find('.vc-calendar__title').text()).toBe('2024年5月');

		// 纵向为主时不翻页
		await touch('touchstart', 100);
		await touch('touchend', 150, 200);
		expect(wrapper.find('.vc-calendar__title').text()).toBe('2024年5月');
	});

	it('受控：modelValue / panelDate / mode 随属性更新；键盘与悬停离开', async () => {
		const wrapper = mount(Calendar, { props: { type: 'daterange' } });

		await wrapper.setProps({ panelDate: new Date(2024, 7, 9) });
		expect(wrapper.find('.vc-calendar__title').text()).toBe('2024年8月');
		await wrapper.setProps({ modelValue: ['2024-08-01', '2024-08-03'] });
		expect(cell(wrapper, '2024-08-02').classes()).toContain('is-range');
		await wrapper.setProps({ mode: 'year' });
		expect(wrapper.classes()).toContain('is-year');
		await wrapper.setProps({ mode: 'month' });

		await wrapper.find('.vc-calendar__arrow.is-next').trigger('keydown', { key: 'Enter' });
		expect(wrapper.find('.vc-calendar__title').text()).toBe('2024年9月');
		await wrapper.find('.vc-calendar__arrow.is-previous').trigger('keydown', { key: 'Enter' });
		expect(wrapper.find('.vc-calendar__title').text()).toBe('2024年8月');
		await wrapper.find('.vc-calendar__title').trigger('keydown', { key: 'Enter' });
		expect(wrapper.classes()).toContain('is-year');
		await wrapper.find('.vc-calendar__title').trigger('click');

		await cell(wrapper, '2024-08-10').trigger('click');
		await cell(wrapper, '2024-08-14').trigger('mouseover');
		expect(cell(wrapper, '2024-08-12').classes()).toContain('is-range');
		await wrapper.find('.vc-calendar__rows').trigger('mouseleave');
		expect(cell(wrapper, '2024-08-12').classes()).not.toContain('is-range');
	});

	it('CalendarMonth: 「开始 / 结束 / 今天」标记与空格占位', async () => {
		const Host = defineComponent({
			props: selectionProps,
			setup(props, { slots, emit }) {
				useCalendarSelection(props, { slots, emit, marks: true, Scroller: MScroller });
				return () => h(CalendarMonth, { year: 2024, month: 4, adjacent: false, title: 'May' });
			}
		});
		const wrapper = mount(Host, { props: { type: 'daterange', modelValue: ['2024-05-10', '2024-05-10'] } });
		const mark = (value: string) => cell(wrapper, value).find('.vc-calendar__mark').text();

		expect(wrapper.find('.vc-calendar__month-title').text()).toBe('May');
		expect(wrapper.findAll('.vc-calendar__row')).toHaveLength(5);
		expect(wrapper.findAll('.is-placeholder')).toHaveLength(4);
		expect(mark('2024-05-10')).toBe('开始/结束');
		expect(mark('2024-05-15')).toBe('今天');

		await wrapper.setProps({ modelValue: ['2024-05-01', '2024-05-20'] });
		expect(mark('2024-05-01')).toBe('开始');
		expect(mark('2024-05-20')).toBe('结束');
		expect(mark('2024-05-15')).toBe('');
	});

	it('utils: getCalendarDates / getLeadingDays', () => {
		const dates = getCalendarDates(2024, 4);

		expect(dates).toHaveLength(42);
		expect(dates[0]).toEqual(new Date(2024, 3, 28));
		expect(dates[41]).toEqual(new Date(2024, 5, 8));
		expect(getCalendarDates(2024, 4, 1)[0]).toEqual(new Date(2024, 3, 29));
		expect(getLeadingDays(2024, 4, 3)).toBe(0);
		expect(getCalendarDates(2024, 0)[0]).toEqual(new Date(2023, 11, 31));
	});

	it('Date2Holiday: 返回公历、农历和节气信息', () => {
		const lunarNewYear = Date2Holiday.get('1900-01-31', 'zh-CN');

		expect([lunarNewYear.lunarYear, lunarNewYear.lunarMonth, lunarNewYear.lunarDate]).toEqual([1900, 1, 1]);
		expect(Date2Holiday.get('1948-10-01', 'zh-CN').holiday).toBe('');
		expect(Date2Holiday.get('1949-10-01', 'zh-CN').holiday).toBe('国庆节');
		expect(Date2Holiday.get('2024-02-09', 'zh-CN').holiday).toBe('除夕');
		expect(Date2Holiday.get('2024-02-10', 'zh-CN').holiday).toBe('春节');
		expect(Date2Holiday.get('2024-04-04', 'zh-CN').holiday).toBe('清明');
		expect(Date2Holiday.get('2024-12-21', 'zh-CN').solarTerm).toBe('冬至');
		expect(Date2Holiday.get('2024-06-10', 'zh-CN').holiday).toBe('端午节');
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
