<template>
	<div class="m-calendar-picker-example">
		<MForm ref="form" :model="model" :rules="rules">
			<MFormItem prop="date" label="日期">
				<MCalendarPicker v-model="model.date" />
			</MFormItem>
			<MFormItem prop="range" label="区间">
				<MCalendarPicker v-model="model.range" type="daterange" lunar />
			</MFormItem>
			<MFormItem prop="dates" label="多选">
				<MCalendarPicker v-model="model.dates" multiple :disabled-date="disabledDate" />
			</MFormItem>
			<MFormItem label="价格">
				<MCalendarPicker v-model="model.price" type="daterange" :confirm="false">
					<template #content="{ date, type }">
						<span v-if="type === 'current'" class="m-calendar-picker-example__price">
							¥{{ 100 + (date.getDate() % 5) * 20 }}
						</span>
					</template>
				</MCalendarPicker>
			</MFormItem>
		</MForm>
		<div class="m-calendar-picker-example__tools">
			<MButton size="small" @click="handleOpen">
				MCalendarPicker.open
			</MButton>
			<MButton size="small" @click="handleValidate">
				校验
			</MButton>
		</div>
		<p class="m-calendar-picker-example__value">
			{{ model }} {{ opened }}
		</p>
	</div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { MCalendarPicker } from '../index.m';
import { MButton } from '../../button/index.m';
import { MForm, MFormItem } from '../../form/index.m';

const form = ref();
const model = reactive({ date: '', range: [], dates: [], price: [] });
const opened = ref('');
const rules = {
	date: [{ required: true, message: '请选择日期' }],
	range: [{ required: true, type: 'array', message: '请选择区间' }]
};

// 早于今天的日期不可选
const today = new Date();
const disabledDate = date => date < new Date(today.getFullYear(), today.getMonth(), today.getDate());

const handleOpen = async () => {
	try {
		const { value } = await MCalendarPicker.open({ type: 'daterange', value: model.range });
		opened.value = `open: ${value.join(' ~ ')}`;
	} catch {
		opened.value = 'open: 已取消';
	}
};

const handleValidate = () => form.value?.validate().catch(() => {});
</script>

<style scoped>
.m-calendar-picker-example__tools {
	display: flex;
	gap: calc(var(--vc-rem) * 16);
	padding: calc(var(--vc-rem) * 24) calc(var(--vc-rem) * 32);
}

.m-calendar-picker-example__price {
	font-size: calc(var(--vc-rem) * 18);
	color: var(--vc-color-error);
}

.m-calendar-picker-example__value {
	padding: 0 calc(var(--vc-rem) * 32);
	font-size: calc(var(--vc-rem) * 24);
	word-break: break-all;
}
</style>
