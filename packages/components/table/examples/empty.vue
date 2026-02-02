<template>
	<div style="padding: 30px;">
		<div @click="hasHeight = !hasHeight" style="margin-bottom: 20px;">
			{{ !hasHeight ? '取消高度' : '设置高度' }}
		</div>
		<Table
			primary-key="id"
			:key="hasHeight"
			resizable
			:rows="8"
			:height="hasHeight ? 600 : void 0"
			:data="[]"
		>
			<TableColumn
				v-for="item in columns"
				:key="item"
				:label="item"
			>
				<template #default="{ rowIndex }">
					<div>{{ item }} {{ rowIndex }}</div>
				</template>
			</TableColumn>
		</Table>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Table, TableColumn } from '..';

const hasHeight = ref(false);
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
</script>
