<template>
	<div style="padding: 30px;">
		<h1>None-Height</h1>
		<!-- 流式高度 + affix：窄屏横向溢出时，横向滚动条与合计行一起吸在视口底部 -->
		<Table primary-key="id" :rows="6" :delay="delay" stripe show-summary affix :data="dataSource">
			<TableColumn
				type="selection"
				fixed="left"
				prop="abc"
				:width="80"
			/>
			<TableColumn
				label="产品信息"
				fixed="left"
				:width="200"
			>
				<template #default="{ rowIndex }">
					<div>{{ rowIndex }}</div>
				</template>
			</TableColumn>

			<TableColumn
				label="款式图片"
				fixed="left"
				:width="160"
			>
				<template #default>
					<div>款式图片</div>
				</template>
			</TableColumn>

			<TableColumn
				label="货号"
				:width="240"
			>
				<template #default="{ rowIndex }">
					<h1 style="color: red;" @click="handleClick">{{ rowIndex }}</h1>
				</template>
			</TableColumn>
			<TableColumn
				label="供应商信息"
				:width="320"
			>
				<template #default="{ row, rowIndex }">
					<div>{{ row?.supplierName }} {{ rowIndex }}</div>
				</template>
			</TableColumn>
			<TableColumn
				label="操作"
				fixed="right"
				:width="120"
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

defineProps({ delay: Number });

const genTableData = length => Array.from({ length }).map((_, index) => ({
	id: `id__${index}`
}));

const dataSource = ref(genTableData(30));
</script>
