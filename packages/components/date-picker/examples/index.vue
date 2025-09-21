<template>
	<div style="margin: 50px">
		<Button @click="type = type === 'date' ? 'datetime' : 'date'">
			{{ type }}
		</Button>
		<DatePicker
			v-model="value"
			v-bind="options"
			:start-date="new Date('2019', '10', '11')"
			:type="type"
			clearable
			format="YYYY-MM-DD"
			placeholder="Select date"
			@change="handleChange"
			@clear="handleClear"
		/>

		<DatePicker
			v-bind="options"
			:start-date="new Date('2019', '10', '11')"
			:type="type"
			clearable
			confirm
			format="YYYY-MM-DD"
			placeholder="Select date"
			@change="handleChange"
		/>
		<DatePicker
			:model-value="valueRange"
			v-bind="options"
			type="datetimerange"
			clearable
			placeholder="Select date"
			style="width: 300px"
			@change="handleRangeChange"
		/>
		<h2>Year</h2>
		<DatePicker
			v-model="year"
			type="year"
			clearable
			confirm
			placeholder="Select date"
			style="width: 200px"
			@change="handleYearChange"
		/>
		<h2>Month</h2>
		<DatePicker
			v-model="month"
			type="month"
			clearable
			placeholder="Select date"
			style="width: 200px"
			@change="handleMonthChange"
		/>
		<h2>自定义</h2>
		<DatePicker
			v-model="month"
			:open="dateOpen"
			type="month"
			clearable
			placeholder="Select date"
			style="width: 200px"
			@change="handleMonthChange"
			@visible-change="handleVisibleChange"
		>
			<span @click.stop="handleSelectMonth">
				{{ month || '请选择' }}
			</span>
		</DatePicker>
		<h2>MonthRange</h2>
		<DatePicker
			v-model="monthrange"
			type="monthrange"
			clearable
			confirm
			placeholder="Select date"
			style="width: 200px"
		/>
		<h2>Quarter</h2>
		{{ quarter }}
		<DatePicker
			v-model="quarter"
			type="quarter"
			clearable
			confirm
			placeholder="Select date"
			style="width: 200px"
			@change="handleQuarterChange"
		/>
		<h2>QuarterRange</h2>
		<DatePicker
			v-model="quarterrange"
			type="quarterrange"
			clearable
			placeholder="Select date"
			style="width: 250px"
			@change="handleQuarterChange"
		/>
		<h2>datetime校验选择时间不可以大于当前时间，精确到时分秒</h2>
		<!-- new Date().getTime() + 24*60*60*1000 -->
		<DatePicker
			v-model="formValidate.date"
			:start-date="new Date()"
			:disabled-date="disabledDate"
			:time-picker-options="timeOpts"
			type="datetime"
			format="YYYY-MM-DD HH:mm:ss"
			class="g-w-300"
			placeholder="请选择"
			@change="handleChangeTime"
		/>
		<h2>datetimerange校验选择时间不可以大于当前时间，精确到时分秒</h2>
		<!-- new Date().getTime() + 24*60*60*1000 -->
		<DatePicker
			v-model="formValidate.daterange"
			:start-date="new Date()"
			:time-picker-options="timeOpts"
			type="datetimerange"
			format="YYYY-MM-DD HH:mm"
			style="width: 300px"
			placeholder="请选择"
			@change="handleChangeTime"
		/>
		<h2>月份禁用</h2>
		<DatePicker
			v-model="formValidate.month"
			:options="disableMonthDate"
			type="month"
			format="YYYY-MM"
			style="width: 300px"
			placeholder="请选择"
		/>
		<DatePicker
			v-model="formValidate.monthrange"
			:options="disableMonthDate"
			type="monthrange"
			format="YYYY-MM"
			style="width: 300px"
			placeholder="请选择"
		/>
		<h2>beforeOk,拦截小于当前日期的值 beforeClear,并且只能通过确认、清空按钮关闭弹层</h2>
		<DatePicker
			v-model="datePromise"
			v-bind="options"
			:outside-clickable="false"
			type="date"
			clearable
			confirm
			format="YYYY-MM-DD"
			placeholder="Select date"
			@change="handleChange"
			@before-ok="handeleOnBeforeOk"
			@before-clear="handeleOnBeforeClear"
			@error="handleError"
		/>
		<h2>Form表单校验</h2>
		<Form
			ref="form"
			:model="formValidate"
			:rules="ruleValidate"
		>
			<FormItem prop="date">
				<DatePicker
					v-model="formValidate.date"
					type="datetime"
					clearable
					placeholder="Select date"
					style="width: 300px"
				/>
			</FormItem>
			<div @click="handleSubmit">
				提交
			</div>
		</Form>
	</div>
</template>
<script setup>
import { ref, computed } from 'vue';
import { Message } from '../../message';
import { Form, FormItem } from '../../form';
import { Button } from '../../button';
import { DatePicker } from '..';

const form = ref(null);
const value = ref('2010-10-10');
const year = ref('');
const month = ref('');
const monthrange = ref('');
const quarter = ref('');
const quarterrange = ref('');
const datePromise = ref(new Date());
const type = ref('date');
const dateOpen = ref(false);
const rangeStart = ref('');
const rangeEnd = ref('');
const disabledDate = ref(
	(date) => {
		return date && (date.valueOf() < Date.now() - 86400000 || date.valueOf() > Date.now() + 864000000);
	}
);
const disableMonthDate = ref({
	disabledDate(date) {
		return date && date.valueOf() < new Date('2020-07-01 00:00');
	},
});
const timeOpts = ref({
	disabledHours: [],
	disabledMinutes: [],
	disabledTime(date) {
		// 大于当前时间
		return date && (date.valueOf() < Date.now());
	}
});
const options = ref({
	disabledDate: () => {
		return false;
	}
});
const formValidate = ref({
	date: '',
	daterange: ['2020-04-17 12:00', '2020-04-18 00:00'],
	month: '',
	monthrange: []
});
const ruleValidate = ref({
	date: [
		{ required: true, type: 'date', message: '请选择日期', trigger: 'change' }
	],
});

const valueRange = computed(() => {
	return [rangeStart.value, rangeEnd.value];
});

const handleError = (err) => {
	console.log('err :>> ', err);
};

const handeleOnBeforeOk = (val) => {
	console.log('val :>> ', val);
	return new Promise((resolve, reject) => {
		const date = new Date();
		if (date < val[0]) {
			resolve(true);
		} else {
			reject(new Error());
		}
	});
};

const handeleOnBeforeClear = () => {
	return new Promise((resolve, reject) => {
		const num = Math.random();
		console.log('num :>> ', num > 0.5);
		setTimeout(() => {
			if (num > 0.5) {
				resolve(true);
			} else {
				reject(new Error(false));
			}
		}, 200);
	});
};

const handleChangeTime = (val) => {
	console.log('val :', val);
};

const handleVisibleChange = (v) => {
	console.log('VisibleChange', v);
	dateOpen.value = v;
};

const handleClear = (v) => {
	console.log('clear', v);
};

const handleChange = (v) => {
	console.log('change', v);
};

const handleRangeChange = (v) => {
	rangeStart.value = v[0];
	rangeEnd.value = v[1];
	console.log('range-change', v);
};

const handleYearChange = (v) => {
	console.log('year-change', v);
};

const handleSelectMonth = () => {
	dateOpen.value = !dateOpen.value;
};

const handleMonthChange = ($month) => {
	month.value = $month;
	dateOpen.value = false;
};

const handleQuarterChange = (v) => {
	console.log('quarter-change', v);
};

const handleSubmit = async () => {
	await form.value.validate();
	Message.success('Success!');
};
</script>
