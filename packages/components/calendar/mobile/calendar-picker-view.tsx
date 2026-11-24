/** @jsxImportSource vue */

import { computed, defineComponent, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import { useLocale } from '../../locale';
import { MRecycleList } from '../../recycle-list/index.m';
import { MScroller } from '../../scroller/index.m';
import { CalendarMonth } from '../calendar-month';
import { monthLocaleKeys } from '../constants';
import { useCalendarSelection } from '../use-calendar-selection';
import { getDayCountOfMonth, getLeadingDays } from '../../date-picker/helper/utils';
import { props as viewProps } from './calendar-picker-view-props';

const COMPONENT_NAME = 'vcm-calendar-picker-view';

// 750 稿：月份标题高与日期行高，与 style.scss 一致（预估尺寸，渲染后按实测校正）
const TITLE_SIZE = 88;
const ROW_SIZE = 120;

interface MonthItem {
	year: number;
	month: number;
	rows: number;
}

/**
 * 纵向的多月列表：星期固定在顶部，月份按 yearRange 全部列出并虚拟化，打开时定位到值所在的月份（没有值时为本月）
 * 选择逻辑与 Calendar 相同；区间选完终点、多选每次点选时发出 update:modelValue、change
 */
export const MCalendarPickerView = defineComponent({
	name: COMPONENT_NAME,
	props: viewProps,
	emits: ['update:modelValue', 'change', 'date-click'],
	setup(props, { emit, slots, expose }) {
		const { t } = useLocale();
		const list = ref<any>();
		const stage = ref<HTMLElement>();
		// 视口顶部所在月份的下标：浮动标题显示它
		const current = ref(0);
		const selection = useCalendarSelection(props, { slots, emit, marks: true, Scroller: MScroller });
		const { yearRange, firstDayOfWeek } = selection;

		const months = computed(() => {
			const [min, max] = yearRange.value;
			const result: MonthItem[] = [];
			for (let year = min; year <= max; year++) {
				for (let month = 0; month < 12; month++) {
					result.push({
						year,
						month,
						rows: Math.ceil((getLeadingDays(year, month, firstDayOfWeek.value) + getDayCountOfMonth(year, month)) / 7)
					});
				}
			}
			return result;
		});

		const estimateSize = ({ row }: { row: MonthItem }) => TITLE_SIZE + row.rows * ROW_SIZE;

		// 日期所在月份的下标（超出 yearRange 时取边界）
		const getIndex = (date: Date) => {
			const [min, max] = yearRange.value;
			const year = Math.min(Math.max(date.getFullYear(), min), max);
			return (year - min) * 12 + (year === date.getFullYear() ? date.getMonth() : year === min ? 0 : 11);
		};

		current.value = getIndex(selection.dates.value[0] || new Date());

		/**
		 * 滚动到日期所在的月份（置顶）
		 * @param date ~
		 */
		const scrollToDate = (date: Date) => {
			current.value = getIndex(date);
			list.value?.scrollToIndex(current.value);
		};

		// 虚拟列表的项用 transform 定位，sticky 不可用：由顶部的浮动标题显示当前月份，滚到下一个月份的标题时切换
		let frame = 0;
		const handleScroll = () => {
			cancelAnimationFrame(frame);
			frame = requestAnimationFrame(() => {
				const top = stage.value?.getBoundingClientRect().top;
				if (top === undefined) return;

				const items = stage.value!.querySelectorAll<HTMLElement>('[data-index]');
				for (let i = 0; i < items.length; i++) {
					const rect = items[i].getBoundingClientRect();
					if (rect.top <= top + 1 && rect.bottom > top + 1) {
						current.value = Number(items[i].dataset.index);
						return;
					}
				}
			});
		};

		onBeforeUnmount(() => cancelAnimationFrame(frame));

		onMounted(() => {
			nextTick(() => list.value?.scrollToIndex(current.value));
		});

		expose({ scrollToDate });

		const getTitle = (item: MonthItem) => {
			return t('vc.Calendar.yearMonth', { year: item.year, month: t(monthLocaleKeys[item.month]), number: item.month + 1 });
		};

		return () => {
			return (
				<div class="vc-calendar vcm-calendar vcm-calendar-picker-view">
					<div class="vc-calendar__week">
						{ selection.weekdays.value.map((item, index) => <span key={index} class="vc-calendar__weekday">{ item }</span>) }
					</div>
					<div ref={stage} class="vcm-calendar-picker-view__stage">
						<MRecycleList
							ref={list}
							class="vcm-calendar-picker-view__list"
							data={months.value}
							estimateSize={estimateSize}
							disabled
							onScroll={handleScroll}
						>
							{{
								default: ({ row, index }: { row: MonthItem; index: number }) => (
									<CalendarMonth
										year={row.year}
										month={row.month}
										adjacent={false}
										title={getTitle(row)}
										data-index={index}
									/>
								)
							}}
						</MRecycleList>
						{
							months.value[current.value] && (
								<div class="vc-calendar__month-title vcm-calendar-picker-view__title">
									{ getTitle(months.value[current.value]) }
								</div>
							)
						}
					</div>
				</div>
			);
		};
	}
});
