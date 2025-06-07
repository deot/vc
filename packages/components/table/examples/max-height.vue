<template>
	<div style="padding: 30px;">
		<Button @click="handleTestingStart">
			内存测试
		</Button>
		<Button @click="handleTestingEnd">
			取消测试
		</Button>
		<h1 @click="isActive = !isActive">Max-Height</h1>
		<Table v-if="isActive" primary-key="id" :rows="6" border stripe show-summary max-height="600" :data="dataSource">
			<TableColumn
				type="selection"
				:width="80"
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
import { Button } from '../../button';

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
</script>
