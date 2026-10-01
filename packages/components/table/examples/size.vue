<template>
	<div style="padding: 30px;">
		<div class="table-controls">
			<Select
				v-for="item in CONTROLS"
				:key="item.key"
				v-model="controls[item.key]"
				:data="item.data"
				:label="item.label"
			/>
		</div>
		<Table
			:data="dataSource"
			:size="controls.size"
			primary-key="id"
			border
			stripe
			show-summary
		>
			<TableColumn
				prop="name"
				label="名称"
				fixed="left"
				:width="120"
			/>
			<TableColumn
				prop="date"
				label="日期"
				:width="160"
			/>
			<TableColumn
				prop="desc"
				label="说明"
				:min-width="360"
			/>
			<TableColumn
				prop="value"
				label="数值"
				fixed="right"
				:width="120"
			/>
		</Table>
	</div>
</template>
<script setup>
import { ref, reactive, onBeforeUnmount, watch } from 'vue';
import { Table, TableColumn } from '..';
import { Select } from '../../select';

// 对照项：每项一个 Select；medium 为默认尺寸
const CONTROLS = [
	{
		key: 'size',
		label: 'size',
		data: [
			{ value: 'medium', label: 'medium（默认）' },
			{ value: 'large', label: 'large' },
			{ value: 'small', label: 'small' },
			{ value: 'mini', label: 'mini' }
		]
	}
];
const controls = reactive(Object.fromEntries(CONTROLS.map(({ key, data }) => [key, data[0].value])));

const dataSource = ref(
	Array.from({ length: 6 }, (_, index) => ({
		id: index + 1,
		name: `条目 ${index + 1}`,
		date: `2016-05-0${index + 1}`,
		desc: '这是一段较长的说明文字，用于展示不同尺寸下单元格的换行与间距',
		value: (index + 1) * 100
	}))
);

// 右上角的性能读数：切换对照项后清零
window.$perf?.observe();
watch(controls, () => window.$perf?.reset());
onBeforeUnmount(() => window.$perf?.disconnect());
</script>

<style lang="scss">
.table-controls {
	display: flex;
	gap: 12px;
	margin-bottom: 16px;

	.vc-select {
		width: 240px;
	}
}
</style>
