<template>
	<div style="padding: 30px;">
		<div v-for="col in columns" :key="col.id">
			{{ col }}
		</div>
		<div style="margin-bottom: 16px;">
			<span style="margin-right: 12px;">列显隐：</span>
			<label
				v-for="col in columns"
				:key="col.id"
				style="margin-right: 12px; cursor: pointer;"
			>
				<input
					type="checkbox"
					:checked="!col.hidden"
					@change="handleToggle(col)"
				>
				{{ col.label || col.type || col.id }}
			</label>
		</div>
		<div style="margin-bottom: 16px;">
			<Button @click="handleReverse">反转列顺序</Button>
			<Button @click="handleShowAll">全部显示</Button>
		</div>
		<Table
			v-model:columns="columns"
			primary-key="id"
			:data="dataSource"
		>
			<TableColumn
				type="selection"
				:width="60"
			/>
			<TableColumn
				prop="date"
				label="日期"
				:width="180"
			/>
			<TableColumn
				prop="name"
				label="姓名"
			/>
			<TableColumn
				prop="address"
				label="地址"
				:min-width="200"
			/>
			<TableColumn
				label="操作"
				prop="__action__"
			>
				<template #default="{ rowIndex }">
					<Button type="text" @click="handleDelete(rowIndex)">删除</Button>
				</template>
			</TableColumn>
		</Table>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Table, TableColumn } from '..';
import { Button } from '../../button';

// v-model:columns 会回填这里，元素形如 { id, prop, label, type, hidden, ... }
const columns = ref([]);

const dataSource = ref([
	{
		id: 1,
		date: '2011-11-02',
		name: '微一案',
		address: '浙江省杭州市拱墅区祥园路38号15号入口4楼'
	},
	{
		id: 2,
		date: '2011-11-04',
		name: '微一案',
		address: '浙江省杭州市拱墅区祥园路38号11号入口5楼'
	},
	{
		id: 3,
		date: '2011-11-01',
		name: '微一案',
		address: '浙江省杭州市拱墅区祥园路38号11号入口5楼'
	}
]);

// 按 id 切换某列的 hidden，再写回触发更新
const handleToggle = (col) => {
	columns.value = columns.value.map(item => (
		item.id === col.id ? { ...item, hidden: !item.hidden } : item
	));
};

// 调整数组顺序，Table 会按 id 重排
const handleReverse = () => {
	columns.value = [...columns.value].reverse();
};

const handleShowAll = () => {
	columns.value = columns.value.map(item => ({ ...item, hidden: false }));
};

const handleDelete = (rowIndex) => {
	dataSource.value.splice(rowIndex, 1);
};
</script>
