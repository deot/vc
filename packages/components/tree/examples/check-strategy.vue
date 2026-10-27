<template>
	<div class="v-tree-check-strategy">
		<h3>Tree / TreeSelect：勾选回填方式（checkStrategy）</h3>
		<p class="v-tree-check-strategy__tip">
			all：父子联动，回填全部勾选节点；parent：子孙全选时只回填父节点；child：只回填最深的勾选节点；strict：父子独立勾选。
			切换方式后值回到初始状态（子节点形态的输入，各种方式都能还原），勾选后按所选方式回填。TreeSelect 的标签跟随回填方式。
		</p>
		<div class="v-tree-check-strategy__controls">
			<Select v-model="checkStrategy" :data="CHECK_STRATEGIES" label="checkStrategy" />
		</div>
		<div :key="checkStrategy" class="v-tree-check-strategy__stage">
			<div>
				<p>Tree</p>
				<Tree
					v-model="value"
					:data="data"
					:check-strategy="checkStrategy"
					show-checkbox
					default-expand-all
				/>
			</div>
			<div>
				<p>TreeSelect 树形</p>
				<TreeSelect
					v-model="value"
					:data="data"
					:check-strategy="checkStrategy"
					:max="99"
					:max-tag-lines="0"
					clearable
				/>
				<p>TreeSelect 级联</p>
				<TreeSelect
					v-model="value"
					:data="data"
					:check-strategy="checkStrategy"
					:max="99"
					:max-tag-lines="0"
					cascader
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

const CHECK_STRATEGIES = [
	{ value: 'all', label: 'all（联动，回填全部）' },
	{ value: 'parent', label: 'parent（联动，只回填父节点）' },
	{ value: 'child', label: 'child（联动，只回填子节点）' },
	{ value: 'strict', label: 'strict（父子独立）' }
];
const checkStrategy = ref('all');

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
	}
];

const value = ref([]);
watch(
	checkStrategy,
	() => {
		value.value = ['a-3-1', 'a-3-2', 'b-1'];
	},
	{ immediate: true }
);
</script>
<style lang="scss">
.v-tree-check-strategy {
	padding: 20px 240px 20px 20px;
	line-height: 22px;

	&__tip {
		margin: 8px 0 16px;
		color: #666;
	}

	&__controls {
		max-width: 320px;
		margin-bottom: 16px;
	}

	&__stage {
		display: grid;
		max-width: 720px;
		grid-template-columns: 1fr 1fr;
		gap: 24px;
	}

	p {
		margin: 8px 0;
	}
}
</style>
