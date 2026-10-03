<template>
	<div class="audit-stack">
		<div class="audit-row">
			<Button @click="isEmpty = !isEmpty">{{ isEmpty ? '恢复数据' : '切换空数据' }}</Button>
			<Button @click="isLoading = !isLoading">{{ isLoading ? '结束加载' : '加载状态' }}</Button>
		</div>
		<div class="audit-scroll audit-table">
			<Table
				:data="isEmpty ? [] : tableRows" primary-key="id" border stripe show-summary highlight
				:current-row-value="2" :draggable="[true, true]" resizable :width="740" @update:data="tableRows = $event"
			>
				<TableColumn type="selection" :width="50" fixed="left" />
				<TableColumn type="drag" :width="40" fixed="left" />
				<TableColumn type="expand" :width="50">
					<template #default="{ row }"><div class="audit-table__expand">{{ row.label }} · 展开内容</div></template>
				</TableColumn>
				<TableColumn prop="label" label="名称" :width="200" sortable />
				<TableColumn prop="status" label="单选筛选" :width="160" :filter-options="statusFilter" />
				<TableColumn prop="amount" label="合计 / 多选筛选" :width="240" fixed="right" :filter-options="amountFilter" />
			</Table>
			<div v-if="isLoading" class="audit-table-loading"><Spin /></div>
		</div>
		<div class="audit-sample" data-state="树形表格">
			<div class="audit-sample__label">树形表格</div>
			<Table :data="treeRows" primary-key="id" border default-expand-all>
				<TableColumn prop="label" label="树形展开图标" tree />
			</Table>
		</div>
		<p class="audit-hint">横向滚动检查固定列与阴影；拖动把手、表头检查落点与浮层。</p>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Table, TableColumn, Button, Spin } from '@deot/vc';

defineProps({ mobile: Boolean, overlayGeneration: Number });
const tableRows = ref([
	{ id: 1, label: '普通行', status: '正常', amount: 20 },
	{ id: 2, label: '当前行', status: '正常', amount: 40 },
	{ id: 3, label: '展开行', status: '停用', amount: 60 }
]);
const isEmpty = ref(false);
const isLoading = ref(false);
const statusFilter = { data: [{ label: '正常', value: '正常' }, { label: '停用', value: '停用' }] };
const amountFilter = { max: 2, data: [{ label: '20', value: 20 }, { label: '40', value: 40 }, { label: '禁用项', value: 60, disabled: true }] };
const treeRows = [{ id: 'parent', label: '父节点', children: [{ id: 'child', label: '子节点' }] }];
</script>
