<template>
	<div>
		<view
			style="display: flex; padding: 20rpx 0; background: white; flex-wrap: wrap;"
		>
			<button @click="handleChangeLabelPosition">
				样式：{{ labelPosition }},width：{{ labelWidth }}
			</button>
		</view>
	</div>
	<MForm
		ref="form"
		:model="formData"
		:rules="formRules"
		:label-position="labelPosition"
		:label-width="labelWidth"
		@submit.prevent
	>
		<MFormItem v-if="hasLoad" prop="input1" label="异步：" required="input1必填">
			<input v-model="formData.input1" placeholder="input1">
			<template #label>
				<span>异步：</span>
			</template>
			<template #error="{ message }">
				<div style="color: blue;">自定义：{{ message }}</div>
			</template>
		</MFormItem>

		<MFormItem label="嵌套1：" required>
			<MFormItem prop="input2" required="input2必填">
				<input v-model="formData.input2" placeholder="input2">
			</MFormItem>
			<MFormItem prop="input3" required="input3必填">
				<input v-model="formData.input3" placeholder="input3">
			</MFormItem>
		</MFormItem>
		<MFormItem label="嵌套2：" required prop="input45">
			<div style="display: flex;">
				<MFormItem styleless>
					<input v-model="formData.input4" placeholder="input4">
				</MFormItem>
				<div> ~ </div>
				<MFormItem styleless>
					<input v-model="formData.input5" placeholder="input5">
				</MFormItem>
			</div>
		</MFormItem>
		<MFormItem prop="input6" label="自定义组件/需符合规范 - 实时默认验证：" label-position="top" required="input6必填">
			<FakeTpl
				v-model="formData.input6"
				type="text"
				placeholder="input6"
			/>
		</MFormItem>
		<MFormItem prop="input7" label="自定义组件/需符合规范 - 实时Change验证：" label-position="top">
			<FakeTpl
				v-model="formData.input7"
				type="text"
				placeholder="input7"
			/>
		</MFormItem>
		<MFormItem prop="input8" label="自定义组件/需符合规范 - 惰性Blur验证：" label-position="top">
			<FakeTpl
				v-model="formData.input8"
				type="text"
				placeholder="input8"
			/>
		</MFormItem>
		<MFormItem prop="input9" label="自定义组件/需符合规范 - 提交时验证：" label-position="top" required="input9必填">
			<FakeTpl
				v-model="formData.input9"
				type="text"
				placeholder="input9"
				:allow-dispatch="false"
			/>
		</MFormItem>
		<MFormItem prop="array" label="数组~~~~~~~~~~~~~~~~~~~~：" required="数组必填" label-position="top">
			<FakeArray v-model="formData.array" />
		</MFormItem>
		<MFormItem :label-width="0">
			<template
				v-for="(item, index) in formData.items"
				:key="item.id"
			>
				<MFormItem
					:label="'字段【A】 ' + item.index + '：'"
					:prop="'items.' + index + '.value'"
					:rules="{
						required: true,
						message: '字段【A】 ' + item.index +' can not be empty',
						trigger: 'change'
					}"
				>
					<FakeTpl
						v-model="item.value"
						type="text"
						:placeholder="'items.' + index + '.value'"
					>
						<div style="display: flex; word-break: keep-all;">
							<span>{{ index }}</span>
							<span style="color: red;" @click="handleRemove(index)">删除</span>
							<span v-if="index === formData.items.length - 1" @click="handleAdd">添加</span>
						</div>
					</FakeTpl>
				</MFormItem>
			</template>
			<text v-if="!formData.items.length" @click="handleAdd">添加</text>
		</MFormItem>
		<template
			v-for="(item, index) in formData.items2"
			:key="item.id"
		>
			<MFormItem
				:label="'字段【B】 ' + item.index + '：'"
				:prop="'items2.' + index + '.value'"
			>
				<FakeTpl
					v-model="item.value"
					type="text"
					:placeholder="'items2.' + item.index + '.value'"
				/>
			</MFormItem>
		</template>
	</MForm>
	<div placement="bottom">
		<view
			style="display: flex; flex-wrap: wrap; padding: 20rpx 0;"
		>
			<MButton type="primary" @click="handleSubmit">
				提交
			</MButton>
			<MButton @click="handleReset">
				重置
			</MButton>
			<MButton @click="handleSort">
				乱序
			</MButton>
			<MButton @click="handleOnly">
				独立验证
			</MButton>
		</view>
	</div>
</template>
<script setup>
import { ref, reactive, watchEffect, onMounted } from 'vue';
import { getUid } from '@deot/helper-utils';
import { shuffle } from 'lodash-es';
import { MForm, MFormItem } from '../index.m';
import FakeTpl from './fake/tpl.vue'; // 可以使用trigger
import FakeArray from './fake/array.vue'; // 可以使用trigger
import { MButton } from '../../button/index.m';

let index = 0;
const hasLoad = ref(false);
const form = ref(null);
const labelPosition = ref('right');
const labelWidth = ref(120);
const formData = reactive({
	input1: '',
	input2: '',
	input3: '',
	input4: '',
	input5: '',
	input6: '',
	input7: '',
	input8: '',
	array: [],
	items: [
		{
			id: getUid(),
			value: '',
			index
		}
	],
	items2: [
		{
			id: getUid(),
			value: '',
			index: 0
		},
		{
			id: getUid(),
			value: '',
			index: 1
		}
	]
});

const formRules = reactive({
	input45: {
		validate() {
			if (!formData.input4 || !formData.input5) {
				return 'input4/input5必填';
			}
		}
	},
	input7: [
		{
			required: true,
			trigger: 'change',
			message: 'input7必填 - change'
		}
	],
	input8: [
		{
			required: true,
			trigger: 'blur',
			message: 'input8必填 - blur'
		}
	],
	items2: {
		value: [
			{
				required: true,
				message: (v) => {
					return `${v.field}必填`;
				}
			}
		]
	}
});

watchEffect(() => console.log('*.input1', formData.input1));
watchEffect(() => console.log('*.input2', formData.input2));
watchEffect(() => console.log('*.array', formData.array));

const handleSubmit = async () => {
	try {
		await form.value?.validate();
		console.log(formData);
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
	if (!formData.items.length) {
		index = -1;
	}
};

const handleSort = () => {
	formData.items = shuffle(formData.items);
};

const handleChangeLabelPosition = () => {
	labelPosition.value = labelPosition.value == 'top' ? 'right' : labelPosition.value == 'right' ? 'left' : 'top';
	labelWidth.value = labelPosition.value !== 'top' ? 120 : 0;
};

onMounted(() => {
	Array.from({ length: 10 }).forEach(handleAdd);
	setTimeout(() => hasLoad.value = true, 3000);
});
</script>

<style>
input {
	display: inline-block;
	width: 100%;
	box-sizing: border-box;
}
</style>
