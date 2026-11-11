<template>
	<div class="date-picker-mobile-disabled">
		<p>disabledDate 按天判断：不可选的日置灰；年、月只在其中每一天都不可选时置灰。停在置灰项上会回弹到最近的可选项</p>
		<MList>
			<MDatePicker v-model="weekday" type="date" :disabled-date="isWeekend" label="只能选工作日" title="选择日期" />
			<MDatePicker v-model="future" type="date" :disabled-date="isPast" label="今天及以后" title="选择日期" />
			<MDatePicker v-model="birthday" type="date" :disabled-date="isFuture" :year-range="[1950, currentYear]" label="出生日期" title="选择出生日期" />
			<MDatePicker v-model="month" type="month" :disabled-date="isPast" label="本月及以后" title="选择年月" />
		</MList>
		<div class="date-picker-mobile-disabled__output">
			<code>{{ JSON.stringify({ weekday, future, birthday, month }, null, 2) }}</code>
		</div>

		<p>时、分、秒：timePickerOptions 与桌面端相同，steps 为步长；filterable 时隐藏不可选的项</p>
		<MList>
			<MDatePicker
				v-model="meeting"
				type="datetime"
				format="YYYY-MM-DD HH:mm"
				:disabled-date="isWeekend"
				:steps="[1, 15]"
				:time-picker-options="{ disabledHours: offHours }"
				label="会议时间（工作日 9–18 点，15 分钟一档）"
				title="选择会议时间"
			/>
			<MDatePicker
				v-model="filtered"
				type="time"
				format="HH:mm"
				:steps="[1, 30]"
				:time-picker-options="{ disabledHours: offHours, filterable: true }"
				label="隐藏不可选的小时"
				title="选择时间"
			/>
			<MDatePicker
				v-model="stay"
				type="daterange"
				:disabled-date="isPast"
				label="入住与离店"
				title="选择入住与离店日期"
			/>
		</MList>
		<div class="date-picker-mobile-disabled__output">
			<code>{{ JSON.stringify({ meeting, filtered, stay }, null, 2) }}</code>
		</div>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { MList } from '../../list/index.m';
import { MDatePicker } from '../index.m';

const today = new Date(new Date().setHours(0, 0, 0, 0));
const currentYear = today.getFullYear();
const offHours = [0, 1, 2, 3, 4, 5, 6, 7, 8, 19, 20, 21, 22, 23];

const isWeekend = date => date.getDay() === 0 || date.getDay() === 6;
const isPast = date => date < today;
const isFuture = date => date > today;

const weekday = ref('');
const future = ref('');
const birthday = ref('1990-06-15');
const month = ref('');
const meeting = ref('');
const filtered = ref('');
const stay = ref([]);
</script>

<style lang="scss">
.date-picker-mobile-disabled {
	display: grid;
	gap: 12px;
	padding: 16px 0;
	background: #f5f7fa;

	p {
		margin: 0 16px;
		font-size: 13px;
		color: #64758b;
	}

	&__output {
		margin: 0 16px;
		font-size: 12px;

		code {
			word-break: break-all;
			white-space: pre-wrap;
		}
	}
}
</style>
