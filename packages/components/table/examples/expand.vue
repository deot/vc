<template>
	<div style="padding: 20px;">
		<h1>Expand</h1>
		<div class="toolbar">
			<span>渲染模式：</span>
			<Button
				v-for="item in modes"
				:key="item.value"
				:type="mode === item.value ? 'primary' : 'default'"
				@click="mode = item.value"
			>
				{{ item.label }}
			</Button>
		</div>
		<div class="toolbar">
			<Button @click="handleUpdate">
				update
			</Button>
			<Button @click="handleToggle">
				展开/收起 第 1 行
			</Button>
			<span>行数：{{ dataSource.length }}，已展开：{{ expandedCount }}</span>
		</div>
		<Table
			ref="tableRef"
			:data="dataSource"
			:height="mode === 'height' ? 400 : undefined"
			:virtualized="mode === 'virtualized'"
			:expand-row-value="expandRowValue"
			border
			primary-key="id"
			@expand-change="handleExpandChange"
		>
			<TableColumn type="expand">
				<template #default="{ row }">
					<div class="detail">
						<p><b>姓名：</b>{{ row.name }}</p>
						<p class="detail__address">
							<b>地址：</b>{{ row.address }}
						</p>
						<p v-for="(remark, index) in row.remarks" :key="index">
							<b>备注 {{ index + 1 }}：</b>{{ remark }}
						</p>
					</div>
				</template>
			</TableColumn>
			<TableColumn
				prop="id"
				label="ID"
				:width="80"
			/>
			<TableColumn
				prop="date"
				label="日期"
				:width="140"
			/>
			<TableColumn
				prop="name"
				label="姓名"
				:min-width="160"
			>
				<template #default="{ row }">
					<input
						v-if="editingId === row.id"
						v-model="draft.name"
						type="text"
						style="width: 100%;"
					>
					<span v-else>{{ row.name }}</span>
				</template>
			</TableColumn>
			<TableColumn
				prop="address"
				label="地址（多行编辑，展开区随之变高）"
				:min-width="260"
			>
				<template #default="{ row }">
					<textarea
						v-if="editingId === row.id"
						v-model="draft.address"
						rows="3"
						style="width: 100%;"
					/>
					<span v-else>{{ row.address }}</span>
				</template>
			</TableColumn>
			<TableColumn
				label="操作"
				fixed="right"
				:width="160"
			>
				<template #default="{ row }">
					<template v-if="editingId === row.id">
						<Button type="text" @click="handleSave(row)">
							保存
						</Button>
						<Button type="text" @click="handleCancel">
							取消
						</Button>
					</template>
					<template v-else>
						<Button type="text" @click="handleEdit(row)">
							编辑
						</Button>
						<Button type="text" @click="handleDelete(row)">
							删除
						</Button>
					</template>
				</template>
			</TableColumn>
		</Table>
	</div>
</template>
<script setup>
import { ref, reactive, computed } from 'vue';
import { Table, TableColumn } from '..';
import { Button } from '../../button';

const modes = [
	{ label: '普通', value: 'normal' },
	{ label: '虚拟 · height=400', value: 'height' },
	{ label: '虚拟 · virtualized', value: 'virtualized' }
];

const random = () => Math.ceil(Math.random() * 10000);

// 备注行数不一，展开区高度各不相同
const getData = () => Array.from({ length: 100 }, (_, index) => ({
	id: index + 1,
	date: new Date(Date.now() - random() * 3600 * 1000).toISOString().slice(0, 10),
	name: `代号 - ${random()}`,
	address: `祥园路${random()}号`,
	remarks: Array.from({ length: index % 4 + 1 }, (__, i) => `第 ${index + 1} 行的第 ${i + 1} 条备注`)
}));

const mode = ref('normal');
const tableRef = ref();
const dataSource = ref(getData());
const expandRowValue = ref([2]);
// 删除展开行不会触发 expand-change，直接读取当前展开的行
const expandedCount = computed(() => tableRef.value?.store.expand.getRows().length || 0);

const handleExpandChange = (row, expandedRows) => {
	console.log('expand-change', row.id, expandedRows.map(item => item.id));
};

// 重新生成数据，id 不变，展开状态按 primary-key 保留
const handleUpdate = () => {
	dataSource.value = getData();
};

const handleToggle = () => {
	tableRef.value.toggleRowExpansion(dataSource.value[0]);
};

// 编辑：只改草稿，保存时写回行对象
const editingId = ref(null);
const draft = reactive({ name: '', address: '' });
const handleEdit = (row) => {
	editingId.value = row.id;
	draft.name = row.name;
	draft.address = row.address;
};
const handleSave = (row) => {
	row.name = draft.name;
	row.address = draft.address;
	editingId.value = null;
};
const handleCancel = () => {
	editingId.value = null;
};

const handleDelete = (row) => {
	if (editingId.value === row.id) editingId.value = null;
	const index = dataSource.value.findIndex(item => item.id === row.id);
	index !== -1 && dataSource.value.splice(index, 1);
};
</script>
<style scoped>
.toolbar {
	display: flex;
	margin-bottom: 12px;
	flex-wrap: wrap;
	gap: 8px;
	align-items: center;
}

.detail p {
	margin: 4px 0;
}

.detail__address {
	white-space: pre-wrap;
}
</style>
