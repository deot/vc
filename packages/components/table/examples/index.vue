<template>
	<div style="padding: 30px;">
		<Button @click="handleTestingStart">
			内存测试
		</Button>
		<Button @click="handleTestingEnd">
			取消测试
		</Button>
		<h1 @click="isActive = !isActive">Brenchmark</h1>
		<Table
			v-if="isActive"
			primary-key="id"
			:delay="delay"
			:rows="8"
			:height="600"
			:data="dataSource"
			@selection-change="handleChange"
		>
			<TableColumn
				type="selection"
				:width="80"
				fixed="left"
				prop="abc"
			/>
			<TableColumn
				label="产品信息"
				fixed="left"
			>
				<template #default="{ rowIndex, selected }">
					<div>{{ rowIndex }}{{ selected }}</div>
				</template>
			</TableColumn>

			<TableColumn
				label="款式图片"
				fixed="left"
			>
				<template #default="{ row }">
					<div>{{ row.id }}</div>
				</template>
			</TableColumn>

			<TableColumn
				label="货号"
			>
				<template #default="{ rowIndex }">
					<h1 style="color: red;" @click="handleClick">{{ rowIndex }}</h1>
				</template>
			</TableColumn>
			<TableColumn
				label="供应商信息"
			>
				<template #default="{ row, rowIndex }">
					<div @click="row.count++">{{ row?.count }} {{ rowIndex }}</div>
				</template>
			</TableColumn>
			<TableColumn
				v-for="item in columns"
				:key="item"
				:label="item"
			>
				<template #default="{ rowIndex }">
					<div>{{ item }} {{ rowIndex }}</div>
				</template>
			</TableColumn>
			<TableColumn
				label="操作"
				fixed="right"
			>
				<template #default="{ rowIndex }">
					<div @click="handleDelete(rowIndex)">删除</div>
				</template>
			</TableColumn>
		</Table>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Table, TableColumn } from '..';
import { Button } from '../../button';

defineProps({ delay: Number });

const genTableData = length => Array.from({ length }).map((_, index) => ({
	id: `id__${index}`,
	count: 0
}));

const isActive = ref(true);
const dataSource = ref(genTableData(100));

const columns = ref([
	'内部人员',
	'供应商货号',
	'品牌',
	'产品分类',
	'适穿人群',
	'系列/明星/联名',
	'供货渠道',
	'属性',
	'款式状态',
	'供货价',
	'含标供货价',
	'联名费',
	'品类最低价',
	'销售价',
	'达播价',
	'现货/预售',
	'现货库存',
	'聚水潭库存',
	'库存更新时间',
	'在产库存',
	'在产更新时间',
	'总库存',
	'库存等级',
	'倍率',
	'倍率范围',
	'商品层级',
	'当前财年累计销量',
	'近30天销量',
	'近7天销量',
	'可售周数',
	'售罄率',
	'是否专供',
	'是否能推送',
	'推款分销售数',
	'上架店铺数',
	'资料进度',
	'视觉链接',
	'系统标签',
	'天猫测款结果',
	'抖音测款结果',
	'标签',
	'运营备注',
	'操作信息'
]);

let timer;
const handleTestingStart = () => {
	clearInterval(timer);
	timer = setInterval(() => {
		isActive.value = !isActive.value;
	}, 50);
};

const handleTestingEnd = () => {
	clearInterval(timer);
	timer = null;
	isActive.value = false;
};

const handleDelete = (rowIndex) => {
	dataSource.value.splice(rowIndex, 1);
	console.log(dataSource.value.length);
};
const handleChange = (section) => {
	console.log(section.map(i => i.id));
};
</script>
