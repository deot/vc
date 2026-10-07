<template>
	<div style="padding: 20px;">
		<h1>Expand</h1>
		<div class="toolbar">
			<Select
				v-for="item in CONTROLS"
				:key="item.key"
				v-model="controls[item.key]"
				:data="item.data"
				:label="item.label"
			/>
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
			:expanded-values="expandedValues"
			border
			primary-key="id"
			@expand-change="handleExpandChange"
		>
			<TableColumn type="expand">
				<template #default="{ row }">
					<div class="detail">
						<p><b>名称：</b>{{ row.name }}</p>
						<p class="detail__desc">
							<b>说明：</b>{{ row.desc }}
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
				label="名称"
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
				prop="desc"
				label="说明（多行编辑，展开区随之变高）"
				:min-width="260"
			>
				<template #default="{ row }">
					<textarea
						v-if="editingId === row.id"
						v-model="draft.desc"
						rows="3"
						style="width: 100%;"
					/>
					<span v-else>{{ row.desc }}</span>
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
import { ref, reactive, computed, onBeforeUnmount, watch } from 'vue';
import { Table, TableColumn } from '..';
import { Button } from '../../button';
import { Select } from '../../select';

// 对照项：每项一个 Select
const CONTROLS = [
	{
		key: 'mode',
		label: '渲染模式',
		data: [{ value: 'normal', label: '普通' }, { value: 'height', label: '虚拟 · height=400' }, { value: 'virtualized', label: '虚拟 · virtualized' }]
	}
];
const controls = reactive(Object.fromEntries(CONTROLS.map(({ key, data }) => [key, data[0].value])));
const mode = computed(() => controls.mode);

const random = () => Math.ceil(Math.random() * 10000);

// 备注行数不一，展开区高度各不相同
const getData = () => Array.from({ length: 100 }, (_, index) => ({
	id: index + 1,
	date: new Date(Date.now() - random() * 3600 * 1000).toISOString().slice(0, 10),
	name: `条目 ${random()}`,
	desc: `条目说明 ${random()}`,
	remarks: Array.from({ length: index % 4 + 1 }, (__, i) => `第 ${index + 1} 行的第 ${i + 1} 条备注`)
}));

const tableRef = ref();
const dataSource = ref(getData());
const expandedValues = ref([2]);
// 删除展开行不会触发 expand-change，直接读取当前展开的行
const expandedCount = computed(() => tableRef.value?.store.expand.getRows().length || 0);

const handleExpandChange = ({ row, expanded, expandedRows }) => {
	console.log('expand-change', row.id, expanded, expandedRows.map(item => item.id));
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
const draft = reactive({ name: '', desc: '' });
const handleEdit = (row) => {
	editingId.value = row.id;
	draft.name = row.name;
	draft.desc = row.desc;
};
const handleSave = (row) => {
	row.name = draft.name;
	row.desc = draft.desc;
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

// 右上角的性能读数：切换对照项后清零
window.$perf?.observe();
watch(controls, () => window.$perf?.reset());
onBeforeUnmount(() => window.$perf?.disconnect());
</script>
<style scoped>
.toolbar {
	display: flex;
	margin-bottom: 12px;
	flex-wrap: wrap;
	gap: 8px;
	align-items: center;
}

.toolbar .vc-select {
	width: 260px;
}

.detail p {
	margin: 4px 0;
}

.detail__desc {
	white-space: pre-wrap;
}
</style>
