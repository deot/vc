<template>
	<div style="padding: 30px;">
		<Button @click="handleTestingStart">
			内存测试
		</Button>
		<Button @click="handleTestingEnd">
			取消测试
		</Button>
		<h1 @click="isActive = !isActive">Row-Height</h1>
		<Table
			v-if="isActive"
			primary-key="id"
			:rows="6"
			border
			stripe
			show-summary
			:delay="delay"
			:height="600"
			:row-height="100"
			:data="dataSource"
			@selection-change="handleChange"
		>
			<TableColumn
				type="selection"
				fixed="left"
				prop="abc"
			/>
			<TableColumn
				label="产品信息"
				fixed="left"
			>
				<template #default="{ rowIndex, selected }">
					<div>{{ rowIndex }}{{ selected }}</div>
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

const isActive = ref(true);
const genTableData = length => Array.from({ length }).map((_, index) => ({
	id: `id__${index}`
}));

const dataSource = ref(genTableData(30));

let timer;
const handleTestingStart = () => {
	clearInterval(timer);
	timer = setInterval(() => {
		isActive.value = !isActive.value;
	}, 50);
};

const handleTestingEnd = () => {
	clearInterval(timer);
	timer = null;
	isActive.value = false;
};

const handleDelete = (rowIndex) => {
	dataSource.value.splice(rowIndex, 1);
};
const handleChange = (section) => {
	console.log(section.map(i => i.id));
};
</script>
