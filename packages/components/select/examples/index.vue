<template>
	<div style="margin: 40px;">
		<!-- Tips: components/transition/README.md -->
		<Button @click="handleTestingStart">
			内存测试
		</Button>
		<Button @click="handleTestingEnd">
			取消测试
		</Button>
		<Button @click="disabled = !disabled">
			disabled: {{ disabled }}
		</Button>

		<!-- 基本 -->
		<div style="margin: 40px 0 ">
			<Select
				v-model="value1"
				:disabled="disabled"
				:data="cityList.map((i, index) => ({ ...i, disabled: index === 1 }))"
				clearable
				searchable
				style="width: 200px"
				@change="handleChange"
				@ready="handleReady"
				@close="handleClose"
				@visible-change="handleVisibleChange"
			/>
		</div>

		<!-- 基本分组 -->
		<div style="margin: 40px 0 ">
			<Select
				v-model="value1"
				style="width: 200px"
				searchable
				:data="[{ value: 'Hot Cities', children: cityList1 }, { value: 'Other Citie', children: cityList2 }]"
			/>
		</div>

		<!-- 基本多选 -->
		<div style="margin: 40px 0 ">
			<Select
				v-model="value2"
				:max="5"
				:disabled="disabled"
				style="width: 200px"
				searchable
				:data="[{ value: 'Hot Cities', children: cityList1 }, { value: 'Other Citie', children: cityList2 }]"
			/>
		</div>

		<!-- 搜索单选 -->
		<div style="margin: 40px 0 ">
			<Select
				v-model="value3"
				:load-data="handleSearch"
				style="width: 200px"
				searchable
				:data="searchData"
			/>
		</div>

		<!-- 搜索多选 -->
		<div style="margin: 40px 0 ">
			<Select
				v-model="value4"
				:max="5"
				:load-data="handleSearch"
				style="width: 200px"
				searchable
				:data="[
					{ value: 'Hot Cities', children: [...searchData1, { value: '不会被过滤', filterable: false  }] },
					{ value: 'Other Cities', children: searchData2 }
				]"
			/>
		</div>

		<!-- 基本异步 -->
		<div style="margin: 40px 0 ">
			<Select
				v-model="value5"
				clearable
				searchable
				search-placeholder="请输入"
				style="width: 200px"
				:data="cityListAsync.map((i, index) => ({ ...i, disabled: index === 1 }))"
			/>
		</div>

		<!-- 基本异步value -->
		<div style="margin: 40px 0 ">
			<Select
				v-model="valueAsync"
				clearable
				searchable
				style="width: 200px"
				:data="cityList.map((i, index) => ({ ...i, disabled: index === 1 }))"
			/>
		</div>

		<!-- form -->

		<Form
			ref="form"
			:model="formValidate"
			:rules="ruleValidate"
			:label-width="196"
			position="left"
			@submit.prevent
		>
			<FormItem label="设置单选：" prop="value">
				<Select
					v-model="formValidate.value"
					clearable
					style="width: 300px;"
					:data="cityList"
				/>
			</FormItem>
			<FormItem label="设置多选：" prop="value1">
				<Select
					v-model="formValidate.value1"
					:max="5"
					clearable
					style="width: 300px;"
					:data="cityList"
				/>
			</FormItem>

			<FormItem label="搜索设置单选：" prop="value1">
				<Select
					v-model="value3"
					:load-data="handleSearch"
					style="width: 200px"
					searchable
					:data="searchData"
				/>
			</FormItem>
		</Form>

		<!-- 清空数据和options时，currentLable 不会消失 -->
		<div style="margin: 40px 0 ">
			<p>清空数据和options时，currentLable 不会消失</p><br>
			<Select
				v-model="formValidate.value3"
				clearable
				searchable
				style="width: 200px"
				:data="cityList"
				@change="handleClear"
			/>
			<Select
				v-model="formValidate.value4"
				clearable
				searchable
				style="width: 200px"
				:data="cityList"
			/>
		</div>
		<div style="margin: 40px 0 ">
			<Select
				v-model="formValidate.value4"
				clearable
				searchable
				style="width: 200px"
				:data="cityTree"
			/>
		</div>
	</div>
</template>
<script setup>
import { ref, onMounted, reactive } from 'vue';
import { Select } from '..';
import { Button } from '../../button';
import { Form, FormItem } from '../../form';

import {
	cityList as $cityList,
	cityList1 as $cityList1,
	cityList2 as $cityList2,
	searchData as $searchData,
	cityTree as $cityTree
} from './basic/data';

const form = ref(null);
const disabled = ref(false);

const cityList = ref($cityList);
const cityList1 = ref($cityList1);
const cityList2 = ref($cityList2);
const cityTree = ref($cityTree);
const value1 = ref(1);
const value2 = ref(['1', '4']);

const value3 = ref('');
const value4 = ref([]);
const searchData = ref([]);
const searchData1 = ref([]);
const searchData2 = ref([]);

const value5 = ref('1');
const cityListAsync = ref([]);

const valueAsync = ref('');

const formValidate = reactive({
	value: '',
	value1: [],
	value2: '',
	value3: '',
	value4: ''
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
let timer;
const handleClear = (id) => {
	if (!id) {
		formValidate.value4 = '';
		cityList.value = [];
	}
};

const handleTestingStart = () => {
	clearInterval(timer);
	timer = setInterval(() => {
		document.querySelector('.vc-select input').click();
	}, 50);
};

const handleTestingEnd = () => {
	clearInterval(timer);
	timer = null;
};

const handleSearch = () => {
	return new Promise((resolve) => {
		setTimeout(() => {
			searchData.value = $searchData;

			searchData1.value = $cityList1;
			searchData2.value = $cityList2;
			resolve();
		}, 1000);
	});
};

const handleChange = (v) => {
	!timer && console.log(v);
};

const handleReady = () => {
	!timer && console.log('ready');
};

const handleClose = () => {
	!timer && console.log('close');
};

const handleVisibleChange = (v) => {
	!timer && console.log('visible-change', v);
};

onMounted(() => {
	setTimeout(() => {
		cityListAsync.value = $cityList;

		valueAsync.value = '1';
	}, 2000);
});
</script>
