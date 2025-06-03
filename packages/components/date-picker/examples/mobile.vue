<template>
	<div>
		<div class="vcm-date-picker-basic">
			<MDatePicker
				v-model="value"
				label="默认值：当前时间"
				mode="yearmonth"
				title="test"
			/>
			<MDatePicker
				v-model="quarterValue"
				:min-date="new Date('2022')"
				label="季度选择"
				mode="quarter"
				title="test"
			/>
			<MDatePicker
				v-model="defaultEmptyValue"
				mode="datetime"
				:min-date="new Date('2022/10/01')"
				extra="无初始值"
				title="无初始值"
			/>
			<MDatePicker
				v-model="valueEmpty"
				mode="datetime"
				extra="空值测试"
				title="2"
			/>
			<MDatePicker
				v-model="value"
				:arrow="false"
				mode="time"
			>
				<template #default="it">
					<h2>
						{{ it.label }}
					</h2>
				</template>
			</MDatePicker>
		</div>
		<br>
		<br>
		<br>
		<h3 @click="handleClick">
			点击直接调用
		</h3>
		<br>
		<br>
		<!-- 表单 -->
		<h2>表单2</h2>
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
					:max-date="formValidate.end"
					mode="datetime"
				/>
			</MFormItem>
			<MFormItem prop="start" label="结束时间">
				<MDatePicker
					v-model="formValidate.end"
					:min-date="formValidate.start"
					mode="datetime"
				/>
			</MFormItem>
			<MFormItem>
				<MButton @click="handleSubmit">
					提交表单
				</MButton>
			</MFormItem>
		</MForm>
		<MDatePickerView v-model="valueView" @change="handleChange" />
	</div>
</template>
<script setup>
import { ref, reactive, onMounted } from 'vue';
import { MForm, MFormItem } from '../../form/index.m';
import { MButton } from '../../button/index.m';
import { MToast } from '../../toast/index';
import { MDatePicker } from '../index.m';

const form = ref(null);
const value = ref(new Date());
const quarterValue = ref([]);
const valueEmpty = ref(undefined);
const defaultEmptyValue = ref('');
const valueView = ref(new Date());
const formValidate = reactive({
	start: undefined,
	end: undefined
});
const ruleValidate = reactive({
	start: [
		{
			required: true,
			type: 'object',
			message: '请选择开始时间',
			trigger: 'change'
		}
	],
	end: [
		{
			required: true,
			type: 'object',
			message: '请选择结束时间',
			trigger: 'change'
		}
	],
});

const handleClick = () => {
	MDatePicker.open({
		mode: 'datetime',
		title: 'yes',
		onOk: (res) => {
			MToast.info(res.label.join('-'));
		}
	});
};

const handleChange = (e) => {
	console.log(e);
};

const handleSubmit = async () => {
	await form.value.validate();

	MToast.info('Success!');
};

onMounted(() => {
	setTimeout(() => {
		valueEmpty.value = new Date('2020');
	}, 3000);

	setTimeout(() => {
		valueEmpty.value = new Date('2020');
	}, 6000);

	setTimeout(() => {
		valueEmpty.value = undefined;
	}, 9000);
});

</script>
