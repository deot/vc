<template>
	<Form 
		ref="form"
		:model="formData" 
		:rules="formRules"
		:label-width="96"
		style="padding-left: 56px; margin-top: 21px"
		@submit.prevent
	>
		<FormItem prop="input1" label="input：">
			<input v-model="formData.input1" style="width: 300px">
		</FormItem>
		<FormItem>
			<FormItem prop="input2" label="嵌套input：">
				<input v-model="formData.input2" style="width: 300px">
			</FormItem>
		</FormItem>
		<FormItem prop="array" label="array：">
			<FakeArray v-model="formData.array" />
		</FormItem>
		<template
			v-for="(item, index) in formData.items"
			:key="item.id"
		>
			<FormItem 
				:label="'Item ' + item.index + '：'"
				:prop="'items.' + index + '.value'"
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
			</FormItem>
		</template>
		<FormItem>
			<div @click="handleAdd">
				Add item
			</div>
		</FormItem>
		<FormItem>
			<Button type="primary" @click="handleSubmit">
				Submit
			</Button>
			<Button style="margin-left: 8px" @click="handleReset">
				Reset
			</Button>
			<Button style="margin-left: 8px" @click="handleSort">
				乱序
			</Button>
			<Button style="margin-left: 8px" @click="handleOnly">
				独立验证
			</Button>
		</FormItem>
	</Form>
</template>
<script setup>
import { ref, reactive, watchEffect } from 'vue';
import { shuffle } from 'lodash-es';
import { Form, FormItem } from '..';
import { getUid } from '@deot/helper-utils';
import FakeTpl from './fake/tpl.vue'; // 可以使用trigger
import FakeArray from './fake/array.vue'; // 可以使用trigger
import { Button } from '../../button';

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
			index: 1
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
		await form.value?.validateField('items.0.value', { scroll: true })
	} catch (e) {
		console.log(e);
	};
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
