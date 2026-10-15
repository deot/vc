<template>
	<div class="editable-example">
		<div class="editable-example__controls">
			<Select
				v-for="item in CONTROLS"
				:key="item.key"
				v-model="controls[item.key]"
				:data="item.data"
				:label="item.label"
			/>
		</div>

		<p>
			直接在输入框里键入：合法时面板跳到该值；Enter、失焦或点外部时提交，带确认栏时 Enter 等同“确定”、直接关闭不提交。
			数字可以不补零（2024-3-5），超出范围（2 月 30 日）或被禁用的日期不会生效，关闭后恢复。Esc 放弃输入并关闭。
			范围类型在一个输入框里输入起止，中间用 separator（默认 “ - ”）分隔，起止颠倒时自动调换。
		</p>

		<div class="editable-example__row">
			<DatePicker
				:key="controls.type"
				v-model="value"
				:type="controls.type"
				:editable="controls.editable === 'on'"
				:confirm="controls.confirm === 'on'"
				:disabled-date="DISABLED_DATES[controls.disabledDate]"
				clearable
				:style="{ width: controls.type.includes('range') ? '380px' : '240px' }"
				@change="v => log('change', v)"
				@ok="v => log('ok', v)"
				@clear="() => log('clear')"
				@visible-change="v => log('visible-change', v)"
			/>
			<div>value: {{ JSON.stringify(value) }}</div>
		</div>

		<ul class="editable-example__logs">
			<li v-for="(item, index) in logs" :key="index">
				{{ item }}
			</li>
		</ul>
	</div>
</template>
<script setup>
import { reactive, ref, watch } from 'vue';
import { Select } from '../../select';
import { DatePicker } from '..';

const INITIAL_VALUES = {
	date: '2024-03-15',
	datetime: '2024-03-15 10:20:30',
	month: '2024-03',
	year: '2024',
	daterange: ['2024-03-01', '2024-03-15'],
	datetimerange: ['2024-03-01 08:00:00', '2024-03-02 18:00:00'],
	monthrange: ['2024-01', '2024-05']
};

const DISABLED_DATES = {
	off: undefined,
	weekend: date => date.getDay() === 0 || date.getDay() === 6,
	past: date => date.getTime() < new Date(2024, 2, 10).getTime()
};

// 对照项：每项一个 Select
const CONTROLS = [
	{ key: 'type', label: '类型', data: Object.keys(INITIAL_VALUES).map(value => ({ value, label: value })) },
	{ key: 'editable', label: 'editable', data: [{ value: 'on', label: '可输入' }, { value: 'off', label: '只读' }] },
	{ key: 'confirm', label: '确认栏', data: [{ value: 'off', label: '按类型（datetime 自带）' }, { value: 'on', label: '开启' }] },
	{
		key: 'disabledDate',
		label: 'disabledDate',
		data: [{ value: 'off', label: '不禁用' }, { value: 'weekend', label: '禁用周末' }, { value: 'past', label: '禁用 2024-03-10 之前' }]
	}
];
const controls = reactive(Object.fromEntries(CONTROLS.map(({ key, data }) => [key, data[0].value])));

const value = ref();
const logs = ref([]);

const log = (name, v) => {
	logs.value = [`${name}${v === undefined ? '' : `: ${JSON.stringify(v)}`}`, ...logs.value].slice(0, 8);
};

// 切换类型时重新挂载，值回到该类型的初始值
watch(
	() => controls.type,
	(type) => {
		value.value = INITIAL_VALUES[type];
		logs.value = [];
	},
	{ immediate: true }
);
</script>
<style lang="scss">
.editable-example {
	padding: 40px;

	// 右上角留给主题 / 变量 / 性能按钮
	&__controls {
		display: grid;
		max-width: 720px;
		margin-right: 220px;
		grid-template-columns: repeat(2, 1fr);
		gap: 12px;
	}

	&__row {
		display: flex;
		align-items: center;
		gap: 16px;
	}

	&__logs {
		padding-left: 20px;
		font-size: 12px;
		line-height: 20px;
	}
}
</style>
