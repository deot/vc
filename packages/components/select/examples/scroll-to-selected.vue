<template>
	<div style="margin: 40px;">
		<!-- 打开时滚动到首个已选中的一项：不在可视范围内时置顶 -->
		<div style="margin: 40px 0">
			<Select
				v-model="single"
				:data="data"
				clearable
				style="width: 200px"
			/>
			<div>value: {{ single }}</div>
		</div>

		<!-- 多选：按选项顺序取首个已选中的一项 -->
		<div style="margin: 40px 0">
			<Select
				v-model="multiple"
				:data="data"
				:max="50"
				clearable
				style="width: 300px"
			/>
			<div>value: {{ multiple }}</div>
		</div>

		<!-- 分组 -->
		<div style="margin: 40px 0">
			<Select
				v-model="grouped"
				:data="groups"
				clearable
				style="width: 200px"
			/>
			<div>value: {{ grouped }}</div>
		</div>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Select } from '..';

const data = Array.from({ length: 50 }, (_, index) => ({
	value: `${index + 1}`,
	label: `选项 ${index + 1}`
}));

const groups = Array.from({ length: 5 }, (_, index) => ({
	value: `g${index + 1}`,
	label: `分组 ${index + 1}`,
	children: Array.from({ length: 6 }, (__, j) => ({
		value: `${index + 1}-${j + 1}`,
		label: `选项 ${index + 1}-${j + 1}`
	}))
}));

const single = ref('30');
const multiple = ref(['42', '18', '25']);
const grouped = ref('4-3');
</script>
