<template>
	<div class="v-tree-max">
		<h3>Tree / TreeSelect：勾选数量（max）</h3>
		<p class="v-tree-max__tip">
			与 Select 同义：1 为单选（父子不联动，TreeSelect 点节点选中并关闭，没有复选框）；大于 1 为多选，最多 max 项（按回填的值计数），
			选满后未勾选的节点不可勾选；0 为不限。单选时 checkStrategy 为 child 只有叶子可选，其余任意节点可选。
			Tree 默认 0，TreeSelect 默认 1。
		</p>
		<div class="v-tree-max__controls">
			<Select v-model="max" :data="MAXES" label="max" />
			<Select v-model="checkStrategy" :data="CHECK_STRATEGIES" label="checkStrategy" />
		</div>
		<div :key="`${max}-${checkStrategy}`" class="v-tree-max__stage">
			<div>
				<p>Tree（复选框）</p>
				<Tree
					v-model="value"
					:data="data"
					:max="max"
					:check-strategy="checkStrategy"
					show-checkbox
					default-expand-all
				/>
				<p>Tree（单选时点行选中，没有复选框）</p>
				<Tree
					v-model="value"
					:data="data"
					:max="max"
					:check-strategy="checkStrategy"
					:show-checkbox="max !== 1"
					:check-on-click-node="max === 1"
					default-expand-all
				/>
			</div>
			<div>
				<p>TreeSelect 树形</p>
				<TreeSelect
					v-model="value"
					:data="data"
					:max="max"
					:check-strategy="checkStrategy"
					:max-tag-lines="0"
					searchable
					clearable
				/>
				<p>TreeSelect 级联</p>
				<TreeSelect
					v-model="value"
					:data="data"
					:max="max"
					:check-strategy="checkStrategy"
					:max-tag-lines="0"
					cascader
					searchable
					clearable
				/>
			</div>
		</div>
		<p>value: {{ value }}</p>
	</div>
</template>
<script setup>
import { ref, watch } from 'vue';
import { Select } from '../../select';
import { Tree, TreeSelect } from '..';

const MAXES = [
	{ value: 1, label: '1（单选）' },
	{ value: 2, label: '2（最多 2 项）' },
	{ value: 0, label: '0（不限）' }
];
const CHECK_STRATEGIES = ['all', 'parent', 'child', 'strict'].map(value => ({ value, label: value }));

const max = ref(1);
const checkStrategy = ref('all');
const value = ref([]);

// 切换后从空值开始
watch([max, checkStrategy], () => {
	value.value = [];
});

const data = [
	{
		value: 'a',
		label: '分组 A',
		children: [
			{ value: 'a-1', label: '条目 A1' },
			{ value: 'a-2', label: '条目 A2' },
			{
				value: 'a-3',
				label: '子分组 A3',
				children: [
					{ value: 'a-3-1', label: '条目 A3-1' },
					{ value: 'a-3-2', label: '条目 A3-2' }
				]
			}
		]
	},
	{
		value: 'b',
		label: '分组 B',
		children: [
			{ value: 'b-1', label: '条目 B1' },
			{ value: 'b-2', label: '条目 B2（禁用）', disabled: true }
		]
	},
	{ value: 'c', label: '条目 C' }
];
</script>
<style lang="scss" scoped>
.v-tree-max {
	padding: 20px;

	&__tip {
		color: var(--vc-color-dark-light);
	}

	&__controls {
		display: flex;
		max-width: 480px;
		gap: 12px;
	}

	&__stage {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 360px));
		gap: 24px;
		margin-top: 16px;
	}
}
</style>
