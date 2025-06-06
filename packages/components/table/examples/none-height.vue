<template>
	<div style="padding: 30px;">
		<h1>None-Height</h1>
		<Table primary-key="id" :rows="6" border stripe show-summary :data="dataSource">
			<TableColumn
				type="selection"
				width="80"
				fixed="left"
				prop="abc"
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
				<template #default>
					<div>款式图片</div>
				</template>
			</TableColumn>

			<TableColumn
				label="货号"
			>
				<template #default="{ rowIndex }">
					<h1 style="color: red;" @click="handleClick">{{ rowIndex }}</h1>
				</template>
			</TableColumn>
			<TableColumn
				label="供应商信息"
			>
				<template #default="{ row, rowIndex }">
					<div>{{ row?.supplierName }} {{ rowIndex }}</div>
				</template>
			</TableColumn>
			<TableColumn
				label="操作"
				fixed="right"
			>
				<template #default>
					<div>操作</div>
				</template>
			</TableColumn>
		</Table>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Table, TableColumn } from '..';

const genTableData = length => Array.from({ length }).map((_, index) => ({
	id: `id__${index}`
}));

const dataSource = ref(genTableData(30));
</script>
