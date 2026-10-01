<template>
	<div style="margin: 40px">
		<Button @click="handleTestingStart">
			内存测试
		</Button>
		<Button @click="handleTestingEnd">
			取消测试
		</Button>
		<div style="margin: 40px 0 ">
			<Cascader
				v-model="value1"
				:data="bigData"
				clearable
				@change="handleChange"
			>
				<template #default="{ label, value }">
					<div>
						{{ label }}, {{ value }}
					</div>
				</template>
			</Cascader>
		</div>
		<div style="margin: 40px 0 ">
			<Cascader v-model="value2" :data="dataSource" clearable />
		</div>
		<div style="margin: 40px 0 ">
			<Cascader v-model="valueAlone" :data="dataSourceAlone" clearable />
		</div>
		<div style="margin: 40px 0 ">
			<Cascader v-model="value3" :data="dataAsyncSource1" clearable />
		</div>
		<div style="margin: 40px 0 ">
			<Cascader v-model="value4" :data="dataAsyncSource2" :load-data="loadData" clearable />
		</div>
		<!-- form -->
		<div style="margin: 40px 0 ">
			<Form
				ref="form"
				:model="formValidate"
				:rules="ruleValidate"
				:label-width="196"
				position="left"
				@submit.prevent
			>
				<FormItem label="设置1：" prop="value">
					<Cascader v-model="formValidate.value" :data="dataSource" clearable />
				</FormItem>
				<FormItem label="设置2：" prop="value1">
					<Cascader v-model="formValidate.value1" :data="dataSource" clearable />
				</FormItem>
			</Form>
		</div>
	</div>
</template>
<script setup>
import { ref, reactive } from 'vue';
import { Cascader } from '..';
import $bigData from './basic/big-data';
import { Button } from '../../button';
import { Form, FormItem } from '../../form';

const value1 = ref([1, 110000, 110100, 110101]);
const value2 = ref([]);
const value3 = ref(['group-b', 'item-b-1']);
const value4 = ref([]);
const valueAlone = ref([]);
const bigData = ref($bigData);
const dataSource = ref([
	{
		value: 'group-a',
		label: '分组 A',
		children: [
			{
				value: 'item-a-1',
				label: '条目 A-1'
			},
			{
				value: 'item-a-2',
				label: '条目 A-2'
			},
			{
				value: 'item-a-3',
				label: '条目 A-3'
			}
		]
	},
	{
		value: 'group-b',
		label: '分组 B',
		children: [
			{
				value: 'item-b-1',
				label: '条目 B-1',
				children: [
					{
						value: 'item-b-1-1',
						label: '条目 B-1-1',
					}
				]
			},
			{
				value: 'item-b-2',
				label: '条目 B-2'
			}
		],
	}
]);
const dataSourceAlone = ref([
	{
		value: 'group-a',
		label: '分组 A'
	},
	{
		value: 'item-b-2',
		label: '条目 B-2'
	}
]);

const dataAsyncSource1 = ref([]);
const dataAsyncSource2 = ref([
	{
		value: 'group-a',
		label: '分组 A',
		children: []
	}
]);
const formValidate = reactive({
	value: ['group-a', 'item-a-1'],
	value1: [],
	value2: []
});
const ruleValidate = reactive({
	value: [
		{
			required: true,
			trigger: 'change',
		}
	],
	value1: [
		{
			required: true,
			trigger: 'change'
		}
	]
});

setTimeout(() => {
	dataAsyncSource1.value = dataSource.value;
}, 2000);

let timer;
const handleTestingStart = () => {
	clearInterval(timer);
	timer = setInterval(() => {
		document.querySelector('.vc-cascader input').click();
	}, 50);
	// Message.info(Math.random().toString(), { mask: false, duration: 110000 });
};
const handleTestingEnd = () => {
	clearInterval(timer);
};
const loadData = () => {
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve([
				{
					value: 'item-a-1',
					label: '条目 A-1'
				},
				{
					value: 'item-a-2',
					label: '条目 A-2'
				},
				{
					value: 'item-a-3',
					label: '条目 A-3'
				}
			]);
		}, 2000);
	});
};

const handleChange = (v, l) => {
	console.log(v, l);
};
</script>
