<template>
	<div style="display: flex; padding: 30px;">
		<div style="flex: 0 0 25%;">
			<h2>SKU 规格矩阵</h2>
			<p style="margin: 0 0 12px; color: #666;">
				动态增删分类与规格，表格按笛卡尔积生成行，分类列通过 getSpan 纵向合并。
			</p>
			<div style="margin-bottom: 8px; cursor: pointer;" @click="handleSave">
				保存（输出到控制台）
			</div>
			<div style="margin-bottom: 16px; cursor: pointer;" @click="handleAddCategory">
				添加分类
			</div>
			<div v-for="(category, categoryIndex) in sku" :key="category.value">
				<div style="display: flex; align-items: center;">
					<h3 style="margin: 8px 0;">分类 {{ category.label }}</h3>
					<span
						style="margin-left: 8px; color: #1677ff; cursor: pointer;"
						@click="handleAddItem(category, categoryIndex)"
					>添加规格</span>
					<span
						style="margin-left: 8px; color: #ff4d4f; cursor: pointer;"
						@click="handleDelCategory(categoryIndex)"
					>删除分类</span>
				</div>
				<ul style="padding-left: 30px; margin: 0 0 12px;">
					<li v-for="(item, itemIndex) in category.children" :key="item.value">
						<span>规格 {{ item.label }}</span>
						<span
							style="margin-left: 8px; color: #ff4d4f; cursor: pointer;"
							@click="handleDelItem(categoryIndex, itemIndex)"
						>删除</span>
					</li>
				</ul>
			</div>
		</div>
		<div style="flex: 1; min-width: 0;">
			<Table
				primary-key="id"
				border
				:data="dataSource"
				:get-span="getSpan"
				style="width: 100%;"
			>
				<TableColumn
					v-for="(column, index) in columns"
					:key="column.value"
					:label="`分类-${column.label}`"
					prop="label"
				>
					<template #default="{ row }">
						<span>{{ row.label[index]?.label }}</span>
					</template>
				</TableColumn>
				<TableColumn label="库存" prop="stock">
					<template #default="{ row }">
						<input v-model="row.stock" type="text">
					</template>
				</TableColumn>
				<TableColumn label="价格" prop="price">
					<template #default="{ row }">
						<input v-model="row.price" type="text">
					</template>
				</TableColumn>
				<TableColumn label="序号" prop="index" :width="80" />
			</Table>
		</div>
	</div>
</template>
<script setup>
import { ref, watch, computed } from 'vue';
import { Table, TableColumn } from '..';

let categoryCount = 0;

const sku = ref([]);
const dataSource = ref([]);

const columns = computed(() => {
	return sku.value.filter(i => i.children.length);
});

const handleSave = () => {
	console.log(dataSource.value, /dataSource/);
	console.log(sku.value, /sku/);
};

const handleAddCategory = () => {
	sku.value.push({
		value: ++categoryCount,
		label: `${categoryCount}`,
		count: 0,
		children: []
	});
};

const handleDelCategory = (categoryIndex) => {
	sku.value.splice(categoryIndex, 1);
};

const handleAddItem = (parent, categoryIndex) => {
	sku.value[categoryIndex].children.push({
		value: `${parent.value}:${++parent.count}`,
		label: `${parent.label}:${parent.count}`,
	});
};

const handleDelItem = (categoryIndex, itemIndex) => {
	sku.value[categoryIndex].children.splice(itemIndex, 1);
};

const getRowSpan = (index) => {
	return columns.value.slice(index).reduce((pre, cur) => {
		return pre * cur.children.length;
	}, 1);
};

const getSpan = ({ row, columnIndex }) => {
	if (columnIndex + 1 >= columns.value.length) {
		return { rowspan: 1, colspan: 1 };
	}

	const rowspan = getRowSpan(columnIndex + 1);

	return {
		rowspan: ((row.index + rowspan) % rowspan) ? 0 : rowspan,
		colspan: 1
	};
};

const makeData = () => {
	const tmp = columns.value.slice();
	if (tmp.length === 0) {
		dataSource.value = [];
		return;
	}

	const total = tmp.reduce((pre, cur) => {
		return pre * (cur.children.length || 1);
	}, 1);

	const target = [];
	for (let i = 0; i < total; i++) {
		const label = columns.value.reduce((pre, cur, columnIndex) => {
			const rowspan = getRowSpan(columnIndex + 1);
			const j = Math.floor(i / rowspan);
			const length = cur.children.length;

			pre.push(
				cur.children[j <= length ? j : j % length]
				|| cur.children[i % length]
				|| {}
			);
			return pre;
		}, []);

		const id = label.reduce((pre, cur) => {
			return `${pre}__${cur.value}`;
		}, i) || Math.random();

		target[i] = {
			id,
			label,
			index: i,
			stock: 0,
			price: 0,
		};
	}

	dataSource.value = target;
};

watch(() => sku.value, makeData, { deep: true });
</script>
