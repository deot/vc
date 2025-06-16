<template>
	<Form
		ref="form"
		:model="formData"
		:rules="formRules"
		:label-width="96"
		style="padding-left: 56px; margin-top: 21px"
		@submit.prevent
	>
		<FormItem prop="input" :label-width="0">
			<VInput v-model="formData.input" style="width: 300px" />
		</FormItem>
		<FormItem prop="input" label="input" :label-width="0">
			<VInput v-model="formData.input" style="width: 300px" />
		</FormItem>
		<FormItem prop="input" label="input">
			<VInput v-model="formData.input" style="width: 300px" />
		</FormItem>

		<FormItem prop="nest" label="nest:">
			<VInput v-model="formData.nest.value" style="width: 300px" />
			<div style="margin-top: 20px;" />
			<FormItem prop="nest.value1" label="nest1:" :label-width="0">
				<VInput v-model="formData.nest.value1" style="width: 300px" />
			</FormItem>
			<FormItem prop="nest.value2" label="nest2:" :label-width="0">
				<input v-model="formData.nest.value2" style="width: 300px; padding: 6px 0">
			</FormItem>
		</FormItem>
		<FormItem prop="array" label="array:" label-style="padding: 0 8px">
			<FakeArray v-model="formData.array" />
		</FormItem>
		<FormItem prop="required" label="required" required="必填" label-position="top" :label-width="0">
			<FakeTpl v-model="formData.required" style="width: 300px" />
		</FormItem>
		<FormItem prop="blur" label="blur" label-position="top" :label-width="0">
			<FakeTpl v-model="formData.blur" style="width: 300px" />
		</FormItem>
		<FormItem prop="change" label="change:" label-style="padding: 0">
			<FakeTpl v-model="formData.change" style="width: 300px" />
		</FormItem>
		<template
			v-for="(item, index) in formData.items"
			:key="item.id"
		>
			<FormItem
				label-style="padding: 0"
				:label="'Item ' + item.index + ':'"
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
import { Input as VInput } from '../../Input';

let index = 0;
const form = ref(null);
const formData = reactive({
	input: '',
	nest: {
		value: '',
		value1: '',
		value2: ''
	},
	blur: '',
	change: '',
	array: [],
	required: '',
	items: [
		{
			id: getUid(),
			value: '',
			index
		}
	]
});

const formRules = reactive({
	blur: {
		trigger: 'blur',
		required: true,
		message: '必填'
	},

	change: {
		trigger: 'change',
		required: true,
		message: '必填'
	},

	nest: {
		validate(v) {
			if (!v.value1 || !v.value2) return Promise.reject('value1，value2必填');
		},
		value1: {
			trigger: 'change',
			required: true,
			message: '必填'
		},
		value2: {
			trigger: 'change',
			required: true,
			message: '必填'
		}
	}
});

watchEffect(() => console.log('*.input', formData.input));
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
		await form.value?.validateField('items.0.value', { scroll: true });
	} catch (e) {
		console.log(e);
	};
};

const handleReset = () => {
	form.value?.reset();
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

const handleSort = () => {
	formData.items = shuffle(formData.items);
};
</script>
