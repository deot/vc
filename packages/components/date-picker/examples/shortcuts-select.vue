<template>
	<div style="margin: 50px">
		<h2>快捷操作</h2>
		<h2>Date-shortcuts</h2>
		<DatePicker
			:model-value="valueRange2"
			:options="dateRangeOptions"
			type="datetimerange"
			clearable
			placeholder="Select date"
			style="width: 300px"
			@change="handleRangeChange2"
		/>
		<DatePicker
			v-model="value"
			:options="dateRange"
			:start-date="new Date('2019', '10', '11')"
			:type="type"
			clearable
			confirm
			format="YYYY-MM-DD"
			placeholder="Select date"
			@change="handleChange"
			@clear="handleClear"
		/>
		<br>
		<h2>Month-shortcuts</h2>
		<DatePicker
			v-model="monthRange"
			type="monthrange"
			clearable
			:options="monthOptions"
			confirm
			placeholder="Select date"
			style="width: 200px"
		/>
		<DatePicker
			v-model="month"
			type="month"
			clearable
			confirm
			:options="monthRangeOptions"
			placeholder="Select date"
			style="width: 200px"
		/>
		<h2>Quarter-shortcuts</h2>
		<DatePicker
			v-model="quarter"
			type="quarter"
			clearable
			confirm
			placeholder="Select date"
			:options="quarterOptions"
			style="width: 200px"
			@change="handleQuarterChange"
		/>
		<h2>QuarterRange-shortcuts</h2>
		{{ quarterrange }}
		<DatePicker
			v-model="quarterrange"
			type="quarterrange"
			:options="quarterRangeOptions"
			clearable
			placeholder="Select date"
			style="width: 250px"
			@change="handleQuarterChange"
		/>
	</div>
</template>
<script setup>
import { ref, computed } from 'vue';
import { DatePicker } from '..';

const value = ref('2010-10-10');
const month = ref('');
const quarter = ref('');
const quarterrange = ref('');
const type = ref('date');
const monthRange = ref('');

const rangeStart2 = ref('');
const rangeEnd2 = ref('');

const monthOptions = ref({
	shortcuts: [
		{
			text: '一年前',
			value() {
				const startDate = new Date('2019-01-01');
				const endDate = new Date('2020-01-01');
				return [startDate, endDate];
			}
		},
		{
			text: '一年后',
			value() {
				const startDate = new Date('2020-01-01');
				const endDate = new Date('2021-01-01');
				return [startDate, endDate];
			}
		}
	]
});
const monthRangeOptions = ref({
	shortcuts: [
		{
			text: '一年前',
			value() {
				const date = new Date();
				date.setTime(date.getTime() - 3600 * 1000 * 24 * 365);
				return date;
			}
		},
		{
			text: '一年',
			value() {
				const date = new Date();
				date.setTime(date.getTime() + 3600 * 1000 * 24 * 365);
				return date;
			}
		},
		{
			text: '二年',
			value() {
				const date = new Date();
				date.setTime(date.getTime() + 3600 * 1000 * 24 * 365 * 2);
				return date;
			}
		},
		{
			text: '三年',
			value() {
				const date = new Date();
				date.setTime(date.getTime() + 3600 * 1000 * 24 * 365 * 3);
				return date;
			}
		},
		{
			text: '五年',
			value() {
				const date = new Date();
				date.setTime(date.getTime() + 3600 * 1000 * 24 * 365 * 5);
				return date;
			}
		}
	]
});
const dateRange = ref({
	shortcuts: [
		{
			text: '一年',
			value() {
				const date = new Date();
				date.setTime(date.getTime() - 3600 * 1000 * 24 * 365);
				return date;
			}
		},
		{
			text: '二年',
			value() {
				const date = new Date();
				date.setTime(date.getTime() - 3600 * 1000 * 24 * 365 * 2);
				return date;
			}
		},
		{
			text: '三年',
			value() {
				const date = new Date();
				date.setTime(date.getTime() - 3600 * 1000 * 24 * 365 * 3);
				return date;
			}
		},
		{
			text: 'onClick方法',
			onClick: () => {
				const num = Math.random() * 10;
				const date = new Date();
				if (num > 5) {
					value.value = new Date(date.setTime(date.getTime() - 3600 * 1000 * 24 * 365));
				} else {
					value.value = new Date(date.setTime(date.getTime() - 3600 * 1000 * 24 * 365 * 2));
				}

				console.log(value.value);
			}
		}
	],
	// disabledDate(time) {
	// 	return time.getTime() > Date.now();
	// }
});
const dateRangeOptions = ref({
	shortcuts: [
		{
			text: '一年前',
			value() {
				const date = new Date();
				date.setTime(date.getTime() - 3600 * 1000 * 24 * 365);
				return [date, new Date()];
			}
		},
		{
			text: '一年',
			value() {
				const date = new Date();
				date.setTime(date.getTime() + 3600 * 1000 * 24 * 365);
				return [new Date(), date];
			}
		},
		{
			text: '二年',
			value() {
				const date = new Date();
				date.setTime(date.getTime() + 3600 * 1000 * 24 * 365 * 2);
				return [new Date(), date];
			}
		},
		{
			text: '三年',
			value() {
				const date = new Date();
				date.setTime(date.getTime() + 3600 * 1000 * 24 * 365 * 3);
				return [new Date(), date];
			}
		},
		{
			text: '五年',
			value() {
				const date = new Date();
				date.setTime(date.getTime() + 3600 * 1000 * 24 * 365 * 5);
				return [new Date(), date];
			}
		}
	],
	// disabledDate(time) {
	// 	return time.getTime() > Date.now();
	// }
});
const quarterOptions = ref({
	shortcuts: [
		{
			text: '19年3季度',
			value() {
				const startDate = new Date('2019-07-01');
				const endDate = new Date('2019-09-01');
				return [startDate, endDate];
			}
		},
		{
			text: '20年1季度',
			value() {
				const startDate = new Date('2020-01-01');
				const endDate = new Date('2020-03-01');
				return [startDate, endDate];
			}
		}
	],
	// disabledDate(time) {
	// 	console.log(time);
	// 	return time > 2 && time < 4;
	// }
});
const quarterRangeOptions = ref({
	shortcuts: [
		{
			text: '19/2季度～21/3季度',
			value() {
				const startDate = new Date('2019-04-01');
				const endDate = new Date('2021-09-30');
				return [startDate, endDate];
			}
		},
		{
			text: '21/2季度～24/4季度',
			value() {
				const startDate = new Date('2021-04-01');
				const endDate = new Date('2024-12-30');
				return [startDate, endDate];
			}
		}
	],
});

const valueRange2 = computed(() => {
	return [rangeStart2.value, rangeEnd2.value];
});

const handleClear = (v) => {
	console.log('clear', v);
};

const handleChange = (v) => {
	console.log('change', v);
};

const handleRangeChange2 = (v) => {
	console.log(v);
	rangeStart2.value = v[0];
	rangeEnd2.value = v[1];
	console.log('range-change', v);
};

const handleQuarterChange = (v) => {
	console.log('quarter-change', v);
};
</script>
