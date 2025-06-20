<template>
	<div style="padding: 30px;">
		<Button @click="handleTestingStart">
			内存测试
		</Button>
		<Button @click="handleTestingEnd">
			取消测试
		</Button>
		<h1 @click="isActive = !isActive">Max-Height</h1>
		<Table
			v-if="isActive"
			primary-key="id"
			:rows="6"
			:delay="delay"
			border
			stripe
			show-summary
			:max-height="600"
			:data="dataSource"
			@selection-change="handleChange"
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
				class="column-class"
			>
				<template #default="{ rowIndex, selected }">
					<div>{{ rowIndex }}{{ selected }}</div>
				</template>
			</TableColumn>

			<TableColumn
				label="款式图片"
				fixed="left"
				:style="{ color: 'red' }"
			>
				<template #default="{ row }">
					<div>{{ row.id }}</div>
				</template>
			</TableColumn>

			<TableColumn
				label="产品信息2"
				prop="label"
				:line="1"
			/>
			<TableColumn
				label="产品信息3"
				prop="id"
				align="right"
				:line="1"
			/>
			<TableColumn
				label="产品信息4"
				prop="id"
				align="right"
			/>

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
				align="right"
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
	id: `id__${index}`,
	label: '1234 ABC '.repeat(20)
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

<style>
:root {
	--vc-table-border-color: red;
}
.column-class {
	color: red!important;;
}
</style>
