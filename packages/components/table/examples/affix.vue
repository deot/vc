<template>
	<div style="padding: 30px;">
		<h1>Affix</h1>
		<div class="table-controls">
			<Select
				v-for="item in CONTROLS"
				:key="item.key"
				v-model="controls[item.key]"
				:data="item.data"
				:label="item.label"
			/>
			<Button @click="handleRefresh">refreshAffix</Button>
		</div>
		<Table
			ref="tableRef"
			primary-key="id"
			:rows="8"
			:delay="delay"
			border
			stripe
			show-summary
			:affix="mode"
			:data="dataSource"
		>
			<TableColumn
				type="selection"
				fixed="left"
				prop="abc"
				:width="80"
			/>
			<TableColumn
				label="序号"
				fixed="left"
			>
				<template #default="{ rowIndex }">
					<div>{{ rowIndex }}</div>
				</template>
			</TableColumn>

			<TableColumn
				label="标识"
				fixed="left"
			>
				<template #default="{ row }">
					<div>{{ row.id }}</div>
				</template>
			</TableColumn>

			<TableColumn
				label="计数"
				prop="count"
			/>
			<TableColumn
				label="内容"
			>
				<template #default="{ row, rowIndex }">
					<div>{{ row?.count }} {{ rowIndex }}</div>
				</template>
			</TableColumn>
			<TableColumn
				label="操作"
				fixed="right"
			>
				<template #default="{ rowIndex }">
					<div @click="handleDelete(rowIndex)">删除</div>
				</template>
			</TableColumn>
		</Table>
	</div>
</template>
<script setup>
import { ref, computed, reactive, onBeforeUnmount, watch } from 'vue';
import { Table, TableColumn } from '..';
import { Button } from '../../button';
import { Select } from '../../select';

defineProps({ delay: Number });

const genTableData = length => Array.from({ length }).map((_, index) => ({
	id: `id__${index}`,
	count: index
}));

const tableRef = ref();
// 对照项：每项一个 Select
const AFFIX = { both: true, header: [true, false], offset: { offset: 10 } };
const CONTROLS = [
	{
		key: 'affix',
		label: 'affix',
		data: [
			{ value: 'both', label: 'true（表头与底部都吸附）' },
			{ value: 'header', label: '[true, false]（只吸附表头）' },
			{ value: 'offset', label: '{ offset: 10 }' }
		]
	}
];
const controls = reactive(Object.fromEntries(CONTROLS.map(({ key, data }) => [key, data[0].value])));
const mode = computed(() => AFFIX[controls.affix]);
const dataSource = ref(genTableData(100));

const handleRefresh = () => {
	tableRef.value?.refreshAffix();
};

const handleDelete = (rowIndex) => {
	dataSource.value.splice(rowIndex, 1);
};

// 右上角的性能读数：切换对照项后清零
window.$perf?.observe();
watch(controls, () => window.$perf?.reset());
onBeforeUnmount(() => window.$perf?.disconnect());
</script>

<style lang="scss">
.table-controls {
	display: flex;
	flex-wrap: wrap;
	gap: 12px;
	margin-bottom: 12px;
	align-items: center;

	.vc-select {
		width: 320px;
	}
}
</style>
