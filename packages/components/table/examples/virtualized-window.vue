<template>
	<main class="virtualized-window-demo">
		<section class="hero">
			<p class="eyebrow">Window viewport</p>
			<h1>页面流中的外部虚拟化 Table</h1>
			<p>
				Table 未设置 height/max-height，通过 virtualized 使用 Window 纵向滚动；表格内部仍负责横向滚动和固定列。
			</p>
			<div class="actions">
				<button type="button" @click="toggleRowHeight">
					动态行高：{{ expanded ? '展开' : '收起' }}
				</button>
				<button type="button" @click="tableRef?.refreshAffix()">refreshAffix</button>
			</div>
		</section>

		<section class="page-content before-content">
			<h2>其他头部内容</h2>
			<p v-for="item in 4" :key="item">
				页面头部区块 {{ item }}：它参与 Window 文档流，但不会进入虚拟行的局部坐标。
			</p>
		</section>

		<Table
			ref="tableRef"
			class="virtualized-table"
			primary-key="id"
			virtualized
			border
			stripe
			show-summary
			:fit="false"
			:affix="{ offset: 8 }"
			:data="tableData"
		>
			<TableColumn type="selection" fixed="left" :width="64" />
			<TableColumn prop="id" label="ID" fixed="left" :width="100" />
			<TableColumn prop="product" label="产品" fixed="left" :width="180">
				<template #default="{ row }">
					<strong>{{ row.product }}</strong>
				</template>
			</TableColumn>
			<TableColumn prop="supplier" label="供应商" :width="220" />
			<TableColumn prop="category" label="分类" :width="160" />
			<TableColumn prop="inventory" label="库存" :width="130" />
			<TableColumn prop="price" label="价格" :width="140" />
			<TableColumn prop="updatedAt" label="更新时间" :width="210" />
			<TableColumn prop="description" label="动态说明" :width="340">
				<template #default="{ row }">
					<div class="dynamic-cell" :class="{ expanded }">
						{{ row.description }}
					</div>
				</template>
			</TableColumn>
			<TableColumn label="操作" fixed="right" :width="120">
				<template #default="{ rowIndex }">
					<a href="javascript:;">查看 {{ rowIndex }}</a>
				</template>
			</TableColumn>
		</Table>

		<section class="page-content after-content">
			<h2>其他尾部内容</h2>
			<p v-for="item in 5" :key="item">
				页面尾部区块 {{ item }}：虚拟表格的尾部边界不会延伸到这里。
			</p>
		</section>
	</main>
</template>

<script setup>
import { nextTick, ref } from 'vue';
import { Table, TableColumn } from '..';

const tableRef = ref();
const expanded = ref(false);

const tableData = Array.from({ length: 2000 }, (_, index) => ({
	id: index + 1,
	product: `虚拟化产品 ${index + 1}`,
	supplier: `供应商 ${(index % 17) + 1}`,
	category: `分类 ${(index % 8) + 1}`,
	inventory: (index * 13) % 1000,
	price: `¥${(99 + (index % 400)).toFixed(2)}`,
	updatedAt: `2026-08-${String((index % 28) + 1).padStart(2, '0')} 10:30`,
	description: `第 ${index + 1} 行使用动态内容高度。切换上方按钮可让已渲染行发生尺寸变化，并继续由虚拟列表测量。`
}));

const toggleRowHeight = async () => {
	expanded.value = !expanded.value;
	await nextTick();
	tableRef.value?.refreshLayout();
	tableRef.value?.refreshAffix();
};
</script>

<style scoped>
.virtualized-window-demo {
	min-width: 760px;
	padding: 24px;
	color: #273444;
	background: #f5f7fa;
}

.hero,
.page-content,
.virtualized-table {
	max-width: 1180px;
	margin-right: auto;
	margin-left: auto;
}

.hero,
.page-content {
	padding: 28px;
	margin-bottom: 24px;
	background: #fff;
	border: 1px solid #d8e2ec;
	border-radius: 10px;
}

.eyebrow {
	font-weight: 600;
	color: #409eff;
}

.actions {
	display: flex;
	gap: 10px;
	margin-top: 16px;
}

.actions button {
	padding: 7px 12px;
	cursor: pointer;
}

.page-content p {
	min-height: 58px;
	padding: 14px;
	background: #f3f6f9;
	border-radius: 6px;
}

.virtualized-table {
	margin-bottom: 24px;
	background: #fff;
}

.dynamic-cell {
	display: -webkit-box;
	max-height: 42px;
	overflow: hidden;
	line-height: 21px;
	-webkit-box-orient: vertical;
	-webkit-line-clamp: 2;
}

.dynamic-cell.expanded {
	display: block;
	max-height: none;
	min-height: 84px;
}

.after-content {
	margin-top: 24px;
}
</style>
