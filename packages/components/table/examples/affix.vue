<template>
	<div style="padding: 30px;">
		<h1>Affix</h1>
		<div style="margin-bottom: 12px;">
			<Button @click="mode = true">
				affix
			</Button>
			<Button @click="mode = [true, false]">
				:affix="[true, false]"
			</Button>
			<Button @click="mode = { offset: 10 }">
				:affix="{ offset: 10 }"
			</Button>
			<Button @click="handleRefresh">
				refreshAffix
			</Button>
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
				label="产品信息"
				fixed="left"
			>
				<template #default="{ rowIndex }">
					<div>{{ rowIndex }}</div>
				</template>
			</TableColumn>

			<TableColumn
				label="款式图片"
				fixed="left"
			>
				<template #default="{ row }">
					<div>{{ row.id }}</div>
				</template>
			</TableColumn>

			<TableColumn
				label="货号"
				prop="count"
			/>
			<TableColumn
				label="供应商信息"
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
import { ref } from 'vue';
import { Table, TableColumn } from '..';
import { Button } from '../../button';

defineProps({ delay: Number });

const genTableData = length => Array.from({ length }).map((_, index) => ({
	id: `id__${index}`,
	count: index
}));

const tableRef = ref();
const mode = ref(true);
const dataSource = ref(genTableData(100));

const handleRefresh = () => {
	tableRef.value?.refreshAffix();
};

const handleDelete = (rowIndex) => {
	dataSource.value.splice(rowIndex, 1);
};
</script>
