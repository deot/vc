<template>
	<div class="virtualized-scroller-demo">
		<header class="demo-header">
			<h1>VC Scroller 中的外部虚拟化 Table</h1>
			<p>外层 Scroller 承载 Y 轴，Table 内部承载 X 轴并同步表头、表体、合计行和固定列。</p>
			<button type="button" @click="tableRef?.refreshAffix()">refreshAffix</button>
		</header>

		<Scroller
			class="scroller-viewport"
			height="560px"
			:native="false"
			:always="true"
		>
			<section class="external-content head-content">
				<h2>Head</h2>
				<p>这是 Table 之前的外部 Scroller 内容。</p>
				<p>继续向下滚动进入虚拟行区域。</p>
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
				:affix="{ fixed: false }"
				:data="tableData"
			>
				<TableColumn type="selection" fixed="left" :width="64" />
				<TableColumn prop="id" label="ID" fixed="left" :width="100" />
				<TableColumn prop="product" label="产品信息" fixed="left" :width="220" />
				<TableColumn prop="supplier" label="供应商" :width="220" />
				<TableColumn prop="sku" label="货号" :width="180" />
				<TableColumn prop="brand" label="品牌" :width="160" />
				<TableColumn prop="inventory" label="库存" :width="140" />
				<TableColumn prop="sales" label="累计销量" :width="160" />
				<TableColumn prop="updatedAt" label="更新时间" :width="220" />
				<TableColumn label="备注" :width="300">
					<template #default="{ row, rowIndex }">
						<div :class="{ 'tall-cell': rowIndex % 9 === 0 }">
							{{ row.remark }}
						</div>
					</template>
				</TableColumn>
				<TableColumn label="操作" fixed="right" :width="120">
					<template #default="{ rowIndex }">
						<a href="javascript:;">编辑 {{ rowIndex }}</a>
					</template>
				</TableColumn>
				<template #append>
					<div class="append-row">Table append slot</div>
				</template>
			</Table>

			<section class="external-content footer-content">
				<h2>Footer</h2>
				<p v-for="item in 5" :key="item">Table 之后的外部内容 {{ item }}</p>
			</section>
		</Scroller>

		<p class="note">
			此示例仅通过现有 <code>affix</code> 配置传入 <code>fixed: false</code>；吸附定位和边界行为没有新增语义。
		</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Scroller } from '../../scroller';
import { Table, TableColumn } from '..';

const tableRef = ref();

const tableData = Array.from({ length: 1200 }, (_, index) => ({
	id: index + 1,
	product: `产品 ${index + 1}`,
	supplier: `供应商 ${(index % 20) + 1}`,
	sku: `SKU-${String(index + 1).padStart(6, '0')}`,
	brand: `品牌 ${(index % 12) + 1}`,
	inventory: (index * 7) % 800,
	sales: (index * 19) % 5000,
	updatedAt: `2026-08-${String((index % 28) + 1).padStart(2, '0')} 16:00`,
	remark: `虚拟行 ${index + 1}，纵向位置来自外层 Scroller，横向位置仍由 Table 内部同步。`
}));
</script>

<style scoped>
.virtualized-scroller-demo {
	padding: 24px;
	color: #273444;
}

.demo-header,
.scroller-viewport,
.note {
	max-width: 1080px;
	margin-right: auto;
	margin-left: auto;
}

.demo-header {
	margin-bottom: 16px;
}

.demo-header button {
	padding: 7px 12px;
	cursor: pointer;
}

.scroller-viewport {
	background: #f5f7fa;
	border: 1px solid #b8c4d1;
	border-radius: 10px;
}

.external-content {
	padding: 28px;
	box-sizing: border-box;
}

.head-content {
	min-height: 300px;
	background: #eaf5ff;
}

.footer-content {
	min-height: 480px;
	background: #fff5df;
}

.footer-content p {
	min-height: 48px;
}

.virtualized-table {
	width: calc(100% - 40px);
	margin: 20px;
	background: #fff;
}

.tall-cell {
	min-height: 76px;
	padding-top: 8px;
	box-sizing: border-box;
}

.append-row {
	padding: 16px;
	color: #66788a;
	text-align: center;
	background: #f8fafc;
}

.note {
	margin-top: 14px;
	color: #66788a;
}
</style>
