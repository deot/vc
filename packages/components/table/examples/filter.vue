<template>
	<div style="padding: 30px;">
		<div style="margin-bottom: 16px;">
			当前筛选：类型 {{ typeFilter || '全部' }}；
			状态 {{ statusFilter.length ? statusFilter.join(' / ') : '全部' }}；
			分组 {{ groupFilter.length ? groupFilter.join(' / ') : '全部' }}
		</div>
		<Table
			:data="filteredData"
			primary-key="id"
			border
		>
			<TableColumn
				prop="name"
				label="名称"
				:width="160"
			/>
			<!-- 单选（max 默认 1）+ 受控：点选即生效，「全部」清空 -->
			<TableColumn
				prop="type"
				label="类型"
				:width="160"
				:filter-options="{
					data: typeOptions,
					modelValue: typeFilter,
					'onUpdate:modelValue': (v) => (typeFilter = v)
				}"
			/>
			<!-- 多选 max: 2 + 受控：勾选后「确认」生效，选满 2 个后其余置灰 -->
			<TableColumn
				prop="status"
				label="状态"
				:width="160"
				:filter-options="{
					data: statusOptions,
					max: 2,
					modelValue: statusFilter,
					'onUpdate:modelValue': (v) => (statusFilter = v)
				}"
			/>
			<!-- 只用 onChange（非受控）：组件自己记录确认结果，多选收到数组 -->
			<TableColumn
				prop="group"
				label="分组"
				:width="160"
				:filter-options="{
					data: groupOptions,
					max: Infinity,
					onChange: handleGroupChange
				}"
			/>
			<TableColumn
				prop="desc"
				label="说明"
				:min-width="240"
			/>
		</Table>
	</div>
</template>
<script setup>
import { ref, computed, onBeforeUnmount, watch } from 'vue';
import { Table, TableColumn } from '..';

const typeOptions = [
	{ label: '类型 A', value: '类型 A' },
	{ label: '类型 B', value: '类型 B' }
];
const statusOptions = [
	{ label: '待处理', value: '待处理' },
	{ label: '进行中', value: '进行中' },
	{ label: '已完成', value: '已完成' },
	{ label: '已归档', value: '已归档', disabled: true }
];
const groupOptions = [
	{ label: '分组 A', value: '分组 A' },
	{ label: '分组 B', value: '分组 B' },
	{ label: '分组 C', value: '分组 C' }
];

const dataSource = ref(
	Array.from({ length: 12 }, (_, index) => ({
		id: index + 1,
		name: `条目 ${index + 1}`,
		type: typeOptions[index % 2].value,
		status: statusOptions[index % 3].value,
		group: groupOptions[index % 3].value,
		desc: `条目 ${index + 1} 的说明`
	}))
);

// 表格只负责交互，过滤由外部完成
const typeFilter = ref();
const statusFilter = ref([]);
const groupFilter = ref([]);

const handleGroupChange = (value) => {
	groupFilter.value = value;
};

const filteredData = computed(() => {
	return dataSource.value.filter((row) => {
		return (!typeFilter.value || row.type === typeFilter.value)
			&& (!statusFilter.value.length || statusFilter.value.includes(row.status))
			&& (!groupFilter.value.length || groupFilter.value.includes(row.group));
	});
});

// 右上角的性能读数：筛选变化后清零
window.$perf?.observe();
watch([typeFilter, statusFilter, groupFilter], () => window.$perf?.reset());
onBeforeUnmount(() => window.$perf?.disconnect());
</script>
