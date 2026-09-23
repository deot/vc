<template>
	<div style="padding: 30px;">
		<div style="margin-bottom: 16px;">
			当前筛选：类型 {{ typeFilter || '全部' }}；
			状态 {{ statusFilter.length ? statusFilter.join(' / ') : '全部' }}；
			城市 {{ cityFilter.length ? cityFilter.join(' / ') : '全部' }}
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
				prop="city"
				label="城市"
				:width="160"
				:filter-options="{
					data: cityOptions,
					max: Infinity,
					onChange: handleCityChange
				}"
			/>
			<TableColumn
				prop="address"
				label="地址"
				:min-width="240"
			/>
		</Table>
	</div>
</template>
<script setup>
import { ref, computed } from 'vue';
import { Table, TableColumn } from '..';

const typeOptions = [
	{ label: '代理升级', value: '代理升级' },
	{ label: '代理加入', value: '代理加入' }
];
const statusOptions = [
	{ label: '待审核', value: '待审核' },
	{ label: '已通过', value: '已通过' },
	{ label: '已驳回', value: '已驳回' },
	{ label: '已归档', value: '已归档', disabled: true }
];
const cityOptions = [
	{ label: '杭州', value: '杭州' },
	{ label: '上海', value: '上海' },
	{ label: '北京', value: '北京' }
];

const dataSource = ref(
	Array.from({ length: 12 }, (_, index) => ({
		id: index + 1,
		name: `申请 ${index + 1}`,
		type: typeOptions[index % 2].value,
		status: statusOptions[index % 3].value,
		city: cityOptions[index % 3].value,
		address: '浙江省杭州市拱墅区祥园路38号浙报印务大厦15号入口4楼'
	}))
);

// 表格只负责交互，过滤由外部完成
const typeFilter = ref();
const statusFilter = ref([]);
const cityFilter = ref([]);

const handleCityChange = (value) => {
	cityFilter.value = value;
};

const filteredData = computed(() => {
	return dataSource.value.filter((row) => {
		return (!typeFilter.value || row.type === typeFilter.value)
			&& (!statusFilter.value.length || statusFilter.value.includes(row.status))
			&& (!cityFilter.value.length || cityFilter.value.includes(row.city));
	});
});
</script>
