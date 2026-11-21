<template>
	<div class="first-day-of-week-example">
		<div class="first-day-of-week-example__controls">
			<Select
				v-for="item in CONTROLS"
				:key="item.key"
				v-model="controls[item.key]"
				:data="item.data"
				:label="item.label"
			/>
		</div>

		<p>
			firstDayOfWeek 用 1 至 7 表示周一至周日。取值顺序：组件上的 firstDayOfWeek → 全局 VcInstance.options.DatePicker.firstDayOfWeek → 7（周日）。
			1 日正好是每周第一天时不补上月日期（2023 年 1 月 1 日是周日，2024 年 5 月 1 日是周三）。
		</p>

		<div class="first-day-of-week-example__row">
			<DatePicker
				:key="controls.month"
				v-model="date"
				:first-day-of-week="firstDayOfWeek"
				open
				style="width: 240px"
			/>
			<DatePicker
				:key="controls.month"
				v-model="range"
				:first-day-of-week="firstDayOfWeek"
				type="daterange"
				open
				style="width: 380px"
			/>
		</div>
	</div>
</template>
<script setup>
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue';
import { Select } from '../../select';
import { VcInstance } from '../../vc';
import { DatePicker } from '..';

const WEEKDAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
const DAYS = WEEKDAYS.map((label, index) => ({ value: index + 1, label: `${index + 1}（${label}）` }));

// 对照项：每项一个 Select；切换月份时用 :key 重新挂载，面板回到该月
const CONTROLS = [
	{ key: 'prop', label: 'firstDayOfWeek', data: [{ value: 0, label: '不传' }, ...DAYS] },
	{ key: 'global', label: '全局配置', data: [{ value: 0, label: '未配置' }, ...DAYS] },
	{
		key: 'month',
		label: '面板月份',
		data: [
			{ value: '2023-01', label: '2023-01（1 日周日）' },
			{ value: '2024-05', label: '2024-05（1 日周三）' },
			{ value: '2021-02', label: '2021-02（1 日周一）' }
		]
	}
];
const controls = reactive(Object.fromEntries(CONTROLS.map(({ key, data }) => [key, data[0].value])));

const firstDayOfWeek = computed(() => controls.prop || undefined);
const date = ref();
const range = ref([]);

watch(
	() => controls.month,
	(month) => {
		date.value = `${month}-15`;
		range.value = [`${month}-10`, `${month}-20`];
	},
	{ immediate: true }
);

const original = VcInstance.options.DatePicker;
watch(
	() => controls.global,
	(value) => {
		VcInstance.configure({ DatePicker: { ...original, firstDayOfWeek: value || undefined } });
	}
);
onBeforeUnmount(() => {
	VcInstance.configure({ DatePicker: original });
});
</script>
<style lang="scss">
.first-day-of-week-example {
	padding: 40px;

	// 右上角留给主题 / 变量 / 性能按钮
	&__controls {
		display: grid;
		max-width: 720px;
		margin-right: 220px;
		grid-template-columns: repeat(3, 1fr);
		gap: 12px;
	}

	// 面板一直展开：并排放在一行，为下方浮层留出高度
	&__row {
		display: flex;
		min-height: 420px;
		align-items: flex-start;
		flex-wrap: wrap;
		gap: 24px 80px;
	}
}
</style>
