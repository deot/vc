<template>
	<div style="padding: 30px;">
		<RadioGroup v-model="size" type="button" style="margin-bottom: 16px;">
			<Radio
				v-for="item in sizes"
				:key="item.value"
				:value="item.value"
				:label="item.label"
			/>
		</RadioGroup>
		<Table
			:data="dataSource"
			:size="size"
			primary-key="id"
			border
			stripe
			show-summary
		>
			<TableColumn
				prop="name"
				label="姓名"
				fixed="left"
				:width="120"
			/>
			<TableColumn
				prop="date"
				label="日期"
				:width="160"
			/>
			<TableColumn
				prop="address"
				label="地址"
				:min-width="360"
			/>
			<TableColumn
				prop="amount"
				label="金额"
				fixed="right"
				:width="120"
			/>
		</Table>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Table, TableColumn } from '..';
import { Radio, RadioGroup } from '../../radio';

// medium 为默认尺寸
const size = ref('medium');
const sizes = [
	{ label: 'large', value: 'large' },
	{ label: 'medium（默认）', value: 'medium' },
	{ label: 'small', value: 'small' },
	{ label: 'mini', value: 'mini' }
];

const dataSource = ref(
	Array.from({ length: 6 }, (_, index) => ({
		id: index + 1,
		name: `用户 ${index + 1}`,
		date: `2016-05-0${index + 1}`,
		address: '浙江省杭州市拱墅区祥园路38号浙报印务大厦15号入口4楼',
		amount: (index + 1) * 100
	}))
);
</script>
