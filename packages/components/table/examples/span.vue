<template>
	<div style="padding: 30px;">
		<h2>getSpan 合并（公共合并渲染层 / CSS Grid）</h2>
		<Table
			primary-key="id"
			border
			highlight
			:data="dataSource"
			:get-span="getSpan"
		>
			<TableColumn
				prop="city"
				label="城市"
				fixed="left"
				:width="120"
			/>
			<TableColumn
				prop="name"
				label="姓名"
				:width="140"
			/>
			<TableColumn
				prop="date"
				label="日期"
				:width="160"
			/>
			<TableColumn
				prop="address"
				label="地址"
				:min-width="240"
			/>
		</Table>

		<h2 style="margin-top: 30px;">虚拟滚动 + 合并块</h2>
		<Table
			primary-key="id"
			border
			:height="300"
			:rows="10"
			:data="bigDataSource"
			:get-span="getSpan"
		>
			<TableColumn
				prop="city"
				label="城市"
				fixed="left"
				:width="120"
			/>
			<TableColumn
				prop="name"
				label="姓名"
				:width="140"
			/>
			<TableColumn
				prop="date"
				label="日期"
				:width="160"
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
import { ref } from 'vue';
import { Table, TableColumn } from '..';

const cities = ['杭州', '上海', '北京'];
const genData = length => Array.from({ length }).map((_, index) => ({
	id: `id__${index}`,
	city: cities[Math.floor(index / 2) % cities.length],
	name: `用户 ${index}`,
	date: `2011-11-${String((index % 28) + 1).padStart(2, '0')}`,
	address: `祥园路 38 号 ${index} 楼`
}));

const dataSource = ref(genData(8));
const bigDataSource = ref(genData(200));

// 城市列：每 2 行合并；首行的"姓名 + 日期"横向合并
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
