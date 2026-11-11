<template>
	<div class="vcm-date-picker-basic">
		<MDatePicker
			v-model="datetime"
			label="日期时间（含秒）"
			type="datetime"
			title="选择日期时间"
		/>
		<div class="vcm-date-picker-basic__output">
			<span>datetime</span>
			<code>{{ stringify(datetime) }}</code>
		</div>
		<MDatePicker
			v-model="datetimeWithoutSecond"
			label="日期时间（无秒）"
			type="datetime"
			format="YYYY-MM-DD HH:mm"
			title="选择日期时间"
		/>
		<div class="vcm-date-picker-basic__output">
			<span>datetimeWithoutSecond</span>
			<code>{{ stringify(datetimeWithoutSecond) }}</code>
		</div>
		<MDatePicker
			v-model="date"
			label="日期"
			type="date"
			format="YYYY/MM/DD"
			title="选择日期"
		/>
		<div class="vcm-date-picker-basic__output">
			<span>date</span>
			<code>{{ stringify(date) }}</code>
		</div>
		<MDatePicker
			v-model="month"
			label="年月"
			type="month"
			title="选择年月"
		/>
		<div class="vcm-date-picker-basic__output">
			<span>month</span>
			<code>{{ stringify(month) }}</code>
		</div>
		<MDatePicker
			v-model="year"
			label="年"
			type="year"
			title="选择年份"
		/>
		<div class="vcm-date-picker-basic__output">
			<span>year</span>
			<code>{{ stringify(year) }}</code>
		</div>
		<MDatePicker
			v-model="quarter"
			format="YYYY/MM/DD"
			label="季度"
			type="quarter"
			title="选择季度"
		/>
		<div class="vcm-date-picker-basic__output">
			<span>quarter</span>
			<code>{{ stringify(quarter) }}</code>
		</div>
		<MDatePicker
			v-model="time"
			:arrow="false"
			type="time"
			format="HH:mm:ss"
			title="选择时间"
		>
			<template #default="it">
				<h2>{{ it.label }}</h2>
			</template>
		</MDatePicker>
		<div class="vcm-date-picker-basic__output">
			<span>time</span>
			<code>{{ stringify(time) }}</code>
		</div>

		<h3 @click="handleClick">
			点击直接调用
		</h3>

		<h2>表单</h2>
		<MForm
			ref="form"
			:show-message="true"
			:model="formValidate"
			:rules="ruleValidate"
			@submit.prevent
		>
			<MFormItem prop="start" label="开始时间">
				<MDatePicker
					v-model="formValidate.start"
					:disabled-date="date => !!formValidate.end && date > new Date(formValidate.end)"
					type="datetime"
				/>
				<div class="vcm-date-picker-basic__output">
					<span>formValidate.start</span>
					<code>{{ stringify(formValidate.start) }}</code>
				</div>
			</MFormItem>
			<MFormItem prop="end" label="结束时间">
				<MDatePicker
					v-model="formValidate.end"
					:disabled-date="date => !!formValidate.start && date < new Date(new Date(formValidate.start).setHours(0, 0, 0, 0))"
					type="datetime"
				/>
				<div class="vcm-date-picker-basic__output">
					<span>formValidate.end</span>
					<code>{{ stringify(formValidate.end) }}</code>
				</div>
			</MFormItem>
			<MFormItem>
				<MButton @click="handleSubmit">
					提交表单
				</MButton>
			</MFormItem>
		</MForm>

		<MDatePickerView
			v-model="viewValue"
			type="datetime"
			format="YYYY-MM-DD HH:mm:ss"
			@change="handleViewChange"
		/>
		<div class="vcm-date-picker-basic__output">
			<span>viewValue</span>
			<code>{{ stringify(viewValue) }}</code>
		</div>
	</div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { MForm, MFormItem } from '../../form/index.m';
import { MButton } from '../../button/index.m';
import { MToast } from '../../toast/index.m';
import { MDatePicker, MDatePickerView } from '../index.m';

const form = ref(null);
const datetime = ref('2024/01/01 08:30:15');
const datetimeWithoutSecond = ref('2024/01/01 08:30:15');
const date = ref('2024/01/01');
const month = ref('2024-01');
const year = ref('2024');
const quarter = ref(['2024/01/01', '2024/03/31']);
const time = ref('08:30:15');
const viewValue = ref('2024/01/01 08:30:15');
const formValidate = reactive({
	start: '',
	end: ''
});
const ruleValidate = reactive({
	start: [
		{
			required: true,
			message: '请选择开始时间',
			trigger: 'change'
		}
	],
	end: [
		{
			required: true,
			message: '请选择结束时间',
			trigger: 'change'
		}
	]
});

const stringify = (value) => {
	return JSON.stringify(value, null, 2);
};

const handleClick = () => {
	MDatePicker.open({
		type: 'datetime',
		format: 'YYYY-MM-DD HH:mm:ss',
		title: '直接调用',
		onOk: (value) => {
			MToast.info(value);
		}
	});
};

const handleViewChange = (value) => {
	viewValue.value = value;
};

const handleSubmit = async () => {
	await form.value.validate();
	MToast.info('Success!');
};
</script>

<style lang="scss">
.vcm-date-picker-basic {
	&__output {
		display: grid;
		padding: 6px 12px 10px;
		font-size: 13px;
		border-bottom: 1px solid #eee;
		grid-template-columns: 150px minmax(0, 1fr);
		gap: 8px;

		code {
			word-break: break-all;
			white-space: pre-wrap;
		}
	}
}
</style>
