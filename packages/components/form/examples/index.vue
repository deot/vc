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
			<Input v-model="formData.input" style="width: 300px" />
		</FormItem>
		<FormItem prop="input" label="input" :label-width="0">
			<Input v-model="formData.input" style="width: 300px" />
		</FormItem>
		<FormItem prop="input" label="input">
			<Input v-model="formData.input" style="width: 300px" />
		</FormItem>
		<FormItem prop="select" label="select" required="必填">
			<Select v-model="formData.select" style="width: 300px" />
		</FormItem>
		<FormItem prop="datepicker" label="datepicker" required="必填">
			<DatePicker v-model="formData.datepicker" style="width: 300px" />
		</FormItem>
		<FormItem prop="textarea" label="textarea" required="必填" label-style="padding-top: 0">
			<Textarea v-model="formData.textarea" style="width: 300px" />
		</FormItem>
		<FormItem prop="radio" label="radio" required="必填">
			<RadioGroup v-model="formData.radio">
				<Radio value="apple" disabled>
					<span>Apple</span>
				</Radio>
				<Radio value="android">
					<span>Android</span>
				</Radio>
				<Radio value="windows">
					<span>Windows</span>
				</Radio>
			</RadioGroup>
		</FormItem>
		<FormItem prop="checkbox" label="checkbox" required="必填">
			<CheckboxGroup v-model="formData.checkbox">
				<Checkbox value="twitter">
					<span>Twitter</span>
				</Checkbox>
				<Checkbox value="facebook">
					<span>Facebook</span>
				</Checkbox>
				<Checkbox value="github" disabled>
					<span>Github</span>
				</Checkbox>
				<Checkbox value="snapchat" disabled>
					<span>Snapchat</span>
				</Checkbox>
			</CheckboxGroup>
		</FormItem>

		<FormItem prop="nest" label="nest:">
			<Input v-model="formData.nest.value" style="width: 300px" />
			<div style="margin-top: 20px;" />
			<FormItem prop="nest.value1" label="nest1:" :label-width="0">
				<Input v-model="formData.nest.value1" style="width: 300px" />
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
		<FormItem prop="swicth" label="swicth:">
			<Switch v-model="formData.swicth" />
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
import { Select } from '../../select';
import { Input } from '../../input';
import { Radio, RadioGroup } from '../../radio';
import { Checkbox, CheckboxGroup } from '../../checkbox';
import { Textarea } from '../../textarea';
import { DatePicker } from '../../date-picker';
import { Switch } from '../../switch';

let index = 0;
const form = ref(null);
const formData = reactive({
	switch: '',
	input: '',
	radio: '',
	select: '',
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
