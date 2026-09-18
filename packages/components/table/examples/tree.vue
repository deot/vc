<template>
	<div style="padding: 20px;">
		<h1>Tree</h1>
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
			<Button @click="expandSelectable = !expandSelectable">
				expandSelectable: {{ expandSelectable }}
			</Button>
			<Button @click="defaultExpandAll = !defaultExpandAll">
				defaultExpandAll: {{ defaultExpandAll }}
			</Button>
			<Button @click="handleUpdate">
				update
			</Button>
			<Button @click="handleToggle">
				展开/收起 第 1 行
			</Button>
			<span>根行：{{ dataSource.length }}，已选：{{ selection.length }}</span>
		</div>
		<Table
			ref="tableRef"
			:data="dataSource"
			:height="mode === 'height' ? 400 : undefined"
			:virtualized="mode === 'virtualized'"
			:load-expand="loadExpand"
			:expand-selectable="expandSelectable"
			:default-expand-all="defaultExpandAll"
			lazy-tree
			border
			primary-key="id"
			@expand-change="handleExpandChange"
			@selection-change="selection = $event"
		>
			<TableColumn
				type="selection"
				:width="63"
			/>
			<TableColumn
				:width="treeWidth"
				:formatter="formatter"
				prop="date"
				label="日期"
			/>
			<TableColumn
				prop="name"
				label="姓名"
				:min-width="180"
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
				label="地址"
				:min-width="200"
			>
				<template #default="{ row }">
					<input
						v-if="editingId === row.id"
						v-model="draft.address"
						type="text"
						style="width: 100%;"
					>
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
import { ref, reactive } from 'vue';
import { Table, TableColumn } from '..';
import { Button } from '../../button';

const modes = [
	{ label: '普通', value: 'normal' },
	{ label: '虚拟 · height=400', value: 'height' },
	{ label: '虚拟 · virtualized', value: 'virtualized' }
];

const random = () => Math.ceil(Math.random() * 10000);
const createRow = (id, extra = {}) => ({
	id,
	date: new Date(Date.now() - random() * 3600 * 1000).toISOString().slice(0, 10),
	name: `代号 - ${random()}`,
	address: `祥园路${random()}号`,
	...extra
});

/**
 * 每 5 行一组：嵌套三级 children / 懒加载节点 / 叶子
 * @returns 根行数据
 */
const getData = () => Array.from({ length: 100 }, (_, index) => {
	const id = `${index + 1}`;
	if (index % 5 === 0) {
		return createRow(id, {
			children: [
				createRow(`${id}-1`, {
					children: [
						createRow(`${id}-1-1`),
						createRow(`${id}-1-2`)
					]
				}),
				createRow(`${id}-2`)
			]
		});
	}
	if (index % 5 === 1) {
		return createRow(id, { hasChildren: true });
	}
	return createRow(id);
});

const mode = ref('normal');
const tableRef = ref();
const expandSelectable = ref(true);
const defaultExpandAll = ref(false);
const treeWidth = ref(180);
const selection = ref([]);
const dataSource = ref(getData());

// 懒加载得到的子行：父行 id -> 响应式数组，对其增删会同步到表格
const lazyChildren = {};
let seed = 0;
const loadExpand = (row, treeNode) => {
	return new Promise((resolve) => {
		setTimeout(() => {
			const list = reactive([
				createRow(`${row.id}-${++seed}`, { hasChildren: treeNode.level < 2 }),
				createRow(`${row.id}-${++seed}`, { hasChildren: treeNode.level < 1 })
			]);
			lazyChildren[row.id] = list;
			resolve(list);
		}, 800);
	});
};

const formatter = ({ row }) => row.date.replace(/-/g, '/');

const handleExpandChange = (row, expanded, maxLevel) => {
	treeWidth.value = 180 + maxLevel * 16;
};

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

/**
 * 在树中找到行所在的数组并移除
 * @param list 当前层级的行
 * @param row 待删除的行
 * @returns 是否已删除
 */
const removeFrom = (list, row) => {
	const index = list.findIndex(item => item.id === row.id);
	if (index !== -1) {
		list.splice(index, 1);
		return true;
	}
	return list.some(item => Array.isArray(item.children) && removeFrom(item.children, row));
};

const handleDelete = (row) => {
	if (editingId.value === row.id) editingId.value = null;
	if (removeFrom(dataSource.value, row)) return;
	Object.keys(lazyChildren).some(id => removeFrom(lazyChildren[id], row));
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
</style>
