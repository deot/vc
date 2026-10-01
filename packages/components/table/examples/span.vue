<!-- getSpan 合并单元格：静态合并、虚拟滚动 + 合并块、按维度组合动态生成的合并矩阵 -->
<template>
	<div style="padding: 30px;">
		<h2>1. getSpan 合并（公共合并渲染层 / CSS Grid）</h2>
		<Table
			primary-key="id"
			border
			highlight
			:data="dataSource"
			:get-span="getSpan"
		>
			<TableColumn prop="group" label="分组" fixed="left" :width="120" />
			<TableColumn prop="name" label="名称" :width="140" />
			<TableColumn prop="date" label="日期" :width="160" />
			<TableColumn prop="desc" label="说明" :min-width="240" />
		</Table>

		<h2 style="margin-top: 30px;">2. 虚拟滚动 + 合并块</h2>
		<Table
			primary-key="id"
			border
			:height="300"
			:rows="10"
			:data="bigDataSource"
			:get-span="getSpan"
		>
			<TableColumn prop="group" label="分组" fixed="left" :width="120" />
			<TableColumn prop="name" label="名称" :width="140" />
			<TableColumn prop="date" label="日期" :width="160" />
			<TableColumn prop="desc" label="说明" :min-width="240" />
		</Table>

		<h2 style="margin-top: 30px;">3. 组合矩阵（rows: {{ matrixData.length }}）</h2>
		<p style="margin: 0 0 12px; color: #666;">
			动态增删维度与选项，表格按笛卡尔积生成行，维度列通过 getSpan 纵向合并。
		</p>
		<div style="display: flex;">
			<div style="flex: 0 0 25%;">
				<div style="margin-bottom: 8px;">
					<Button @click="handleSave">保存（输出到控制台）</Button>
					<Button @click="handleAddDimension">添加维度</Button>
				</div>
				<div v-for="(dimension, dimensionIndex) in dimensions" :key="dimension.value">
					<div style="display: flex; align-items: center;">
						<h3 style="margin: 8px 0;">维度 {{ dimension.label }}</h3>
						<span
							style="margin-left: 8px; color: #1677ff; cursor: pointer;"
							@click="handleAddOption(dimension, dimensionIndex)"
						>添加选项</span>
						<span
							style="margin-left: 8px; color: #ff4d4f; cursor: pointer;"
							@click="dimensions.splice(dimensionIndex, 1)"
						>删除维度</span>
					</div>
					<ul style="padding-left: 30px; margin: 0 0 12px;">
						<li v-for="(option, optionIndex) in dimension.children" :key="option.value">
							<span>选项 {{ option.label }}</span>
							<span
								style="margin-left: 8px; color: #ff4d4f; cursor: pointer;"
								@click="dimension.children.splice(optionIndex, 1)"
							>删除</span>
						</li>
					</ul>
				</div>
			</div>
			<div style="flex: 1; min-width: 0;">
				<Table
					primary-key="id"
					border
					:data="matrixData"
					:get-span="getMatrixSpan"
					style="width: 100%;"
				>
					<TableColumn
						v-for="(column, index) in matrixColumns"
						:key="column.value"
						:label="`维度-${column.label}`"
						prop="label"
					>
						<template #default="{ row }">
							<span>{{ row.label[index]?.label }}</span>
						</template>
					</TableColumn>
					<TableColumn label="数量" prop="quantity">
						<template #default="{ row }">
							<input v-model="row.quantity" type="text">
						</template>
					</TableColumn>
					<TableColumn label="数值" prop="value">
						<template #default="{ row }">
							<input v-model="row.value" type="text">
						</template>
					</TableColumn>
					<TableColumn label="序号" prop="index" :width="80" />
				</Table>
			</div>
		</div>
	</div>
</template>
<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { Table, TableColumn } from '..';
import { Button } from '../../button';

// ---------------------------------------------------------------------
// 1、2：静态合并
// ---------------------------------------------------------------------
const groups = ['分组 A', '分组 B', '分组 C'];
const genData = length => Array.from({ length }).map((_, index) => ({
	id: `id__${index}`,
	group: groups[Math.floor(index / 2) % groups.length],
	name: `条目 ${index}`,
	date: `2026-01-${String((index % 28) + 1).padStart(2, '0')}`,
	desc: `条目 ${index} 的说明`
}));

const dataSource = ref(genData(8));
const bigDataSource = ref(genData(200));

// 分组列：每 2 行合并；首行的"名称 + 日期"横向合并
const getSpan = ({ rowIndex, columnIndex }) => {
	if (columnIndex === 0) {
		return rowIndex % 2 === 0 ? [2, 1] : [0, 0];
	}
	if (rowIndex === 0 && columnIndex === 1) {
		return { rowspan: 1, colspan: 2 };
	}
	if (rowIndex === 0 && columnIndex === 2) {
		return { rowspan: 0, colspan: 0 };
	}
	return [1, 1];
};

// ---------------------------------------------------------------------
// 3：组合矩阵，行由各维度选项的笛卡尔积生成
// ---------------------------------------------------------------------
let dimensionCount = 0;

const dimensions = ref([]);
const matrixData = ref([]);

// 只有带选项的维度才成为一列
const matrixColumns = computed(() => {
	return dimensions.value.filter(i => i.children.length);
});

const handleSave = () => {
	console.log(matrixData.value, /matrixData/);
	console.log(dimensions.value, /dimensions/);
};

const handleAddDimension = () => {
	dimensions.value.push({
		value: ++dimensionCount,
		label: `${dimensionCount}`,
		count: 0,
		children: []
	});
};

const handleAddOption = (parent, dimensionIndex) => {
	dimensions.value[dimensionIndex].children.push({
		value: `${parent.value}:${++parent.count}`,
		label: `${parent.label}:${parent.count}`
	});
};

const getRowSpan = (index) => {
	return matrixColumns.value.slice(index).reduce((pre, cur) => {
		return pre * cur.children.length;
	}, 1);
};

const getMatrixSpan = ({ row, columnIndex }) => {
	if (columnIndex + 1 >= matrixColumns.value.length) {
		return { rowspan: 1, colspan: 1 };
	}

	const rowspan = getRowSpan(columnIndex + 1);

	return {
		rowspan: ((row.index + rowspan) % rowspan) ? 0 : rowspan,
		colspan: 1
	};
};

const makeData = () => {
	const tmp = matrixColumns.value.slice();
	if (tmp.length === 0) {
		matrixData.value = [];
		return;
	}

	const total = tmp.reduce((pre, cur) => {
		return pre * (cur.children.length || 1);
	}, 1);

	const target = [];
	for (let i = 0; i < total; i++) {
		const label = matrixColumns.value.reduce((pre, cur, columnIndex) => {
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
			quantity: 0,
			value: 0
		};
	}

	matrixData.value = target;
};

watch(() => dimensions.value, makeData, { deep: true });

// 右上角的性能读数：维度变化后清零
window.$perf?.observe();
watch(matrixData, () => window.$perf?.reset());
onBeforeUnmount(() => window.$perf?.disconnect());
</script>

<style lang="scss">

.vc-table--border::after, .vc-table--divider::before {
	background-color: yellow;
}

.vc-table--border {
	border-top-color: green;
	border-left-color: blue;
}

.vc-table--border .vc-table__th, .vc-table--border .vc-table__td {
	border-right-color: red;
}

.vc-table--divider .vc-table__td {
	border-bottom-color: purple;
}

.vc-table--border .vc-table__th {
	border-bottom-color: orange;
}

.vc-table__body-wrapper .vc-table__td.vc-table__td.hover-related {
	background-color: pink;
}

.vc-table__body-wrapper .vc-table__td.vc-table__td.hover-row, .vc-table__body-wrapper .vc-table__td.vc-table__td.current-row {
	background-color: lightblue;
}

.vc-table.is-scrolling-right .vc-table__th.is-fixed-left.is-fixed-left-tail::before,
.vc-table.is-scrolling-right .vc-table__td.is-fixed-left.is-fixed-left-tail::before,
.vc-table.is-scrolling-middle .vc-table__th.is-fixed-left.is-fixed-left-tail::before,
.vc-table.is-scrolling-middle .vc-table__td.is-fixed-left.is-fixed-left-tail::before {
	background-image: linear-gradient(to right, rgb(0 0 0 / 25%) 0%, transparent);
}
</style>
