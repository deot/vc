<template>
	<div>
		<Button @click="lazy = !lazy">
			lazy {{ lazy }}
		</Button>
		<Button @click="checkStrictly = !checkStrictly">
			单选独立 {{ checkStrictly }}
		</Button>
		<Tree
			:key="lazy"
			v-model="value"
			:data="data"
			:load-data="loadData"
			:lazy="lazy"
			:check-strictly="checkStrictly"
			:render-content="renderContent"
			show-checkbox
			accordion
			draggable
			default-expand-all
			@check-change="handleCheckChange"
		/>
		<div>value: {{ value }}</div>
		<div>typeof: {{ typeof value }}</div>
		<div>isArray: {{ Array.isArray(value) }}</div>
	</div>
</template>
<script setup lang="jsx">
import { ref, onMounted } from 'vue';
import { random, cloneDeep } from 'lodash-es';
import { Tree } from '..';
import { Button } from '../../button';

const DEFAULT_DATA = [
	{
		value: '1',
		label: '一级 1',
		children: [
			{
				value: '1-1',
				label: '二级 1-1',
				children: [
					{
						value: '1-1-1',
						label: '三级 1-1-1',
						isLeaf: true // 已经是叶子节点
					}
				]
			}
		]
	},
	{
		value: '2',
		label: '一级 2',
		children: [
			{
				value: '2-1',
				label: '二级 2-1',
				children: [
					{
						value: '2-1-1',
						label: '三级 2-1-1'
					}
				]
			},
			{
				value: '2-2',
				label: '二级 2-2',
				children: [
					{
						value: '2-2-1',
						label: '三级 2-2-1'
					}
				]
			}
		]
	},
	{
		value: '3',
		label: '一级 3',
		children: [
			{
				value: '3-1',
				label: '二级 3-1',
				children: [
					{
						value: '3-1-1',
						label: '三级 3-1-1'
					}
				]
			},
			{
				value: '3-2',
				label: '二级 3-2',
				children: [
					{
						value: '3-2-1',
						label: '三级 3-2-1'
					}
				]
			}
		]
	},
	{
		value: '4',
		label: '一级 4',
		children: []
	}
];

const lazy = ref(true);
const checkStrictly = ref(false);
const value = ref([]);
const data = ref(DEFAULT_DATA);
const valueAsync = ref([]);
const dataAsync = ref([]);

let count = 0;
const loadData = () => {
	count++;
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve([
				{
					value: `4-1#${count}`,
					label: `二级 4-1#${count}`,
					children: [
						{
							value: `4-1-1#${count}`,
							label: `三级 4-1-1#${count}`
						}
					],
				},
				{
					value: `4-2#${count}`,
					label: `二级 4-2#${count}`,
					isLeaf: true
				},
				{
					value: `4-3#${count}`,
					label: `二级 4-3#${count}`
				}
			]);
		}, 3000);
	});
};

const handleCheckChange = ($data, checked, indeterminate) => {
	console.log($data, checked, indeterminate);
};

const renderContent = (props) => {
	return (
		<span>
			{props.it.label}
			{' '}
			{props.it.value}
		</span>
	);
};

onMounted(() => {
	setTimeout(() => {
		valueAsync.value = ['1'];
	}, random(100, 300));

	setTimeout(() => {
		dataAsync.value = cloneDeep(data.value);
	}, random(100, 300));
});

</script>
