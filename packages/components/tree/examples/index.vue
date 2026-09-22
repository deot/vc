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
			:render="renderContent"
			show-checkbox
			accordion
			draggable
			default-expand-all
			@check-change="handleCheckChange"
		/>
		<div>value: {{ value }}</div>
		<div>typeof: {{ typeof value }}</div>
		<div>isArray: {{ Array.isArray(value) }}</div>

		<TreeSelect
			v-model="value"
			:data="data"
			:check-strictly="checkStrictly"
			:max="99"
			clearable
		/>

		<div style="margin-top: 12px;">
			<p style="margin: 0 0 8px;">
				回归：级联且非 strict 时，全选「一级 3」下两条三级后删一个 TreeSelect tag，Tree 勾选应与 value 一致
			</p>
			<Button @click="value = ['3', '3-1', '3-1-1', '3-2', '3-2-1']">
				分支 3 全选
			</Button>
			<Button @click="value = ['3', '3-1', '3-1-1']">
				模拟删 tag（仅左枝）
			</Button>
		</div>

		<p style="margin-top: 16px;">
			TreeSelect 级联模式（hover 展开下一级，与树形模式共用 v-model）
		</p>
		<TreeSelect
			v-model="value"
			:data="data"
			:check-strictly="checkStrictly"
			:max="99"
			cascader
			clearable
		/>

		<p style="margin-top: 16px;">
			可搜索（searchable）：空格或逗号分隔多个关键词；树形模式保留层级过滤，级联模式展示扁平路径列表
		</p>
		<TreeSelect
			v-model="valueSearch"
			:data="bigData"
			:check-strictly="checkStrictly"
			:max="999"
			:max-tags="3"
			searchable
			search-placeholder="搜索城市 / 区域"
			clearable
		/>
		<TreeSelect
			v-model="valueSearch"
			:data="bigData"
			:check-strictly="checkStrictly"
			:max="999"
			:max-tags="3"
			searchable
			cascader
			clearable
			style="margin-top: 8px;"
		/>
		<div>valueSearch: {{ valueSearch }}</div>

		<TreeSelect
			v-model="valueAsync"
			:data="dataAsync"
			:check-strictly="checkStrictly"
			clearable
		/>
	</div>
</template>
<script setup lang="jsx">
import { ref, onMounted } from 'vue';
import { random, cloneDeep } from 'lodash-es';
import { Tree, TreeSelect } from '..';
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

// 大量数据：每一列都会出现滚动（Scroller）
const REGIONS = ['华东', '华南', '华北', '华中', '西南', '西北', '东北', '港澳台', '海外', '长三角', '珠三角', '京津冀', '成渝', '关中', '北部湾'];
const BIG_DATA = REGIONS.map((region, i) => ({
	value: `r${i}`,
	label: region,
	children: Array.from({ length: 12 }).map((_, j) => ({
		value: `r${i}-c${j}`,
		label: `${region}城市 ${j + 1}`,
		disabled: i === 0 && j === 1,
		children: Array.from({ length: 8 }).map((__, k) => ({
			value: `r${i}-c${j}-d${k}`,
			label: `${region}城市 ${j + 1} · 区 ${k + 1}`
		}))
	}))
}));

const lazy = ref(true);
const checkStrictly = ref(false);
const value = ref([]);
const data = ref(DEFAULT_DATA);
const bigData = ref(BIG_DATA);
const valueSearch = ref([]);
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
			{props.row.label}
			#
			{props.store.id}
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
