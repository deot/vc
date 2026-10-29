<template>
	<div class="descriptions-example">
		<p>分组：options 中写 { label, children }，或用 DescriptionsGroup；各组放在同一个面板里，组之间有分隔线。连续的、不在分组内的项会合成一个没有标题的分组</p>
		<div class="descriptions-example__controls">
			<Select v-model="theme" :data="THEMES" label="theme" />
		</div>

		<h4>options</h4>
		<Descriptions :theme="theme" :data="data" :options="options" title="详情" />

		<h4>DescriptionsGroup</h4>
		<Descriptions :theme="theme" :data="data">
			<DescriptionsGroup label="基础信息">
				<DescriptionsItem label="编号" prop="code" />
				<DescriptionsItem label="名称" prop="name" />
				<DescriptionsItem label="类型" prop="type" />
			</DescriptionsGroup>
			<DescriptionsGroup>
				<template #label>
					<span>其他信息</span>
					<span class="hint">（#label 插槽）</span>
				</template>
				<DescriptionsItem label="状态" prop="status" />
				<DescriptionsItem label="日期" prop="date" />
			</DescriptionsGroup>
		</Descriptions>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Select } from '../../select';
import { Descriptions, DescriptionsItem, DescriptionsGroup } from '..';

const THEMES = ['fill', 'inverted', 'plain', 'border'].map(value => ({ value, label: value }));
const theme = ref(THEMES[0].value);

const data = {
	code: 'NO-000128',
	name: '条目 128',
	type: '类型 A',
	group: '分组 B',
	status: '进行中',
	date: '2026-10-28',
	value: 36
};
const options = [
	{
		label: '基础信息',
		children: [
			{ label: '编号', prop: 'code' },
			{ label: '名称', prop: 'name' },
			{ label: '类型', prop: 'type' },
			{ label: '分组', prop: 'group' }
		]
	},
	{
		label: '其他信息',
		children: [
			{ label: '状态', prop: 'status' },
			{ label: '日期', prop: 'date' },
			{ label: '数值', prop: 'value', suffix: ' 项' }
		]
	}
];
</script>
<style scoped>
.descriptions-example {
	padding: 20px;
}

.descriptions-example__controls {
	display: flex;
	flex-wrap: wrap;
	gap: 12px;
	margin-bottom: 12px;
}

.descriptions-example__controls .vc-select {
	width: 200px;
}

.hint {
	font-weight: 400;
	color: var(--vc-color-dark-extralight);
}
</style>
