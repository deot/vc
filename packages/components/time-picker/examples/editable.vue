<template>
	<div class="time-editable-example">
		<div class="time-editable-example__controls">
			<Select
				v-for="item in CONTROLS"
				:key="item.key"
				v-model="controls[item.key]"
				:data="item.data"
				:label="item.label"
			/>
		</div>

		<p>
			直接在输入框里键入：合法时时间列滚到该值；Enter、失焦或点外部时提交，Esc 放弃输入并关闭。
			数字可以不补零（9:5:7），超出范围（25 点）或被禁用的时间不会生效，关闭后恢复。范围在一个输入框里输入起止，中间用 “ - ” 分隔。
		</p>

		<div class="time-editable-example__row">
			<TimePicker
				:key="`${controls.type}-${controls.format}`"
				v-model="value"
				:type="controls.type"
				:format="controls.format"
				:editable="controls.editable === 'on'"
				:disabled-hours="DISABLED_HOURS[controls.disabledHours]"
				clearable
				:style="{ width: controls.type === 'timerange' ? '240px' : '160px' }"
				@change="v => log('change', v)"
				@clear="() => log('clear')"
			/>
			<div>value: {{ JSON.stringify(value) }}</div>
		</div>

		<ul class="time-editable-example__logs">
			<li v-for="(item, index) in logs" :key="index">
				{{ item }}
			</li>
		</ul>
	</div>
</template>
<script setup>
import { reactive, ref, watch } from 'vue';
import { Select } from '../../select';
import { TimePicker } from '..';

const DISABLED_HOURS = {
	off: [],
	noon: [12, 13]
};

// 对照项：每项一个 Select
const CONTROLS = [
	{ key: 'type', label: '类型', data: [{ value: 'time', label: 'time' }, { value: 'timerange', label: 'timerange' }] },
	{ key: 'format', label: 'format', data: [{ value: 'HH:mm:ss', label: 'HH:mm:ss' }, { value: 'HH:mm', label: 'HH:mm（隐藏秒列）' }] },
	{ key: 'editable', label: 'editable', data: [{ value: 'on', label: '可输入' }, { value: 'off', label: '只读' }] },
	{ key: 'disabledHours', label: 'disabledHours', data: [{ value: 'off', label: '不禁用' }, { value: 'noon', label: '禁用 12、13 点' }] }
];
const controls = reactive(Object.fromEntries(CONTROLS.map(({ key, data }) => [key, data[0].value])));

const value = ref();
const logs = ref([]);

const log = (name, v) => {
	logs.value = [`${name}${v === undefined ? '' : `: ${JSON.stringify(v)}`}`, ...logs.value].slice(0, 8);
};

// 切换类型、格式时重新挂载，值回到初始值
watch(
	() => `${controls.type}-${controls.format}`,
	() => {
		const time = controls.format === 'HH:mm' ? '10:30' : '10:30:00';
		const end = controls.format === 'HH:mm' ? '18:00' : '18:00:00';
		value.value = controls.type === 'timerange' ? [time, end] : time;
		logs.value = [];
	},
	{ immediate: true }
);
</script>
<style lang="scss">
.time-editable-example {
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
