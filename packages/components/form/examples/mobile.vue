<template>
	<MForm 
		ref="form"
		:model="formData" 
		:rules="formRules"
		:label-width="70"
		@submit.prevent
	>
		<MFormItem prop="input1" label="input：">
			<input v-model="formData.input1">
		</MFormItem>
		<MFormItem>
			<MFormItem prop="input2" label="嵌套input：">
				<input v-model="formData.input2">
			</MFormItem>
		</MFormItem>
		<MFormItem prop="array" label="array：">
			<FakeArray v-model="formData.array" />
		</MFormItem>
		<template
			v-for="(item, index) in formData.items"
			:key="item.id"
		>
			<MFormItem 
				:label="'Item ' + item.index + '：'"
				:prop="'items.' + item.index + '.value'"
				:rules="{
					required: true, 
					message: 'Item ' + item.index +' can not be empty', 
					trigger: 'change'
				}"
			>
				<FakeTpl 
					v-model="item.value" 
					type="text" 
					placeholder="Enter something..."
				>
					<span @click="handleRemove(index)">Delete - {{ index }}</span>
				</FakeTpl>
			</MFormItem>
		</template>
		<MFormItem>
			<div @click="handleAdd">
				Add item
			</div>
		</MFormItem>
		<MFormItem>
			<MButton type="primary" @click="handleSubmit">
				Submit
			</MButton>
			<MButton style="margin-left: 8px" @click="handleReset">
				Reset
			</MButton>
			<MButton style="margin-left: 8px" @click="handleSort">
				乱序
			</MButton>
			<MButton style="margin-left: 8px" @click="handleOnly">
				独立验证
			</MButton>
		</MFormItem>
	</MForm>
</template>
<script setup>
import { ref, reactive, watchEffect } from 'vue';
import { getUid } from '@deot/helper-utils';
import { shuffle } from 'lodash-es';
import { MForm, MFormItem } from '../index.m';
import FakeTpl from './fake/tpl.vue'; // 可以使用trigger
import FakeArray from './fake/array.vue'; // 可以使用trigger
import { MButton } from '../../button/index.m';


let index = 0;
const form = ref(null);
const formData = reactive({
	input1: '',
	input2: '',
	array: [],
	items: [
		{
			id: getUid(),
			value: '',
			index
		}
	]
});

const formRules = reactive({

});

watchEffect(() => console.log('*.input1', formData.input1));
watchEffect(() => console.log('*.input2', formData.input2));
watchEffect(() => console.log('*.array', formData.array));


const handleSubmit = async () => {
	try {
		await form.value?.validate();
	} catch (e) {
		console.log(e);
	}
};

const handleOnly = async () => {
	try {
		form.value?.validateField('items.0.value', { scroll: true });
	} catch (e) {
		console.log(e);
	}
};

const handleReset = () => {
	form.value?.resetFields();
};

const handleAdd = () => {
	index++;

	formData.items.push({
		id: getUid(),
		value: '',
		status: 1,
		index
	});
};


const handleRemove = (i) => {
	formData.items.splice(i, 1);
};

const handleSort = (i) => {
	formData.items = shuffle(formData.items);
};
</script>
