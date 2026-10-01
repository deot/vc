<template>
	<div style="display: flex; flex-direction: column;">
		<!-- single -->
		<Radio v-model="isSelected" @change="handleChange">
			{{ isSelected }}
		</Radio>

		<!-- group -->
		<RadioGroup v-model="selectedOption">
			<RadioButton label="option-a" disabled>
				<span>选项 A</span>
			</RadioButton>
			<RadioButton label="option-b">
				<span>选项 B</span>
			</RadioButton>
			<Radio label="option-c">
				<span>选项 C</span>
			</Radio>
		</RadioGroup>
		<RadioGroup v-model="selectedOption">
			<Radio label="option-a">
				<span>选项 A</span>
			</Radio>
			<Radio label="option-b" disabled>
				<span>选项 B</span>
			</Radio>
			<Radio label="option-c">
				<span>选项 C</span>
			</Radio>
		</RadioGroup>
		<RadioGroup v-model="selectedItem" vertical disabled>
			<Radio label="条目 A" />
			<Radio label="条目 B" />
			<Radio label="条目 C" />
		</RadioGroup>

		<RadioGroup v-model="selectedGroup" type="button" @change="handleChange">
			<Radio label="分组 A" />
			<Radio label="分组 B" disabled />
			<Radio label="分组 C" />
			<Radio label="分组 D" />
		</RadioGroup>
		<Form
			ref="formValidate"
			:model="formValidate"
			:rules="ruleValidate"
			:label-width="96"
			style="padding-left: 56px; margin-top: 21px"
			@submit.prevent
		>
			<FormItem prop="selectedItem" label="条目：">
				<RadioGroup v-model="formValidate.selectedItem">
					<Radio label="条目 A" />
					<Radio label="条目 B" />
					<Radio label="条目 C" />
				</RadioGroup>
			</FormItem>
			<FormItem prop="selectedItem" label="条目：">
				<Radio label="条目 A" />
			</FormItem>
			<FormItem prop="input" label="条目：">
				<Input style="width: 300px" />
			</FormItem>
		</Form>
	</div>
</template>
<script setup>
import { onUpdated, ref, reactive } from 'vue';
import { Radio, RadioButton, RadioGroup } from '..';
import { Form, FormItem } from '../../form/index';
import { Input } from '../../input/index';

const isSelected = ref(false);
const selectedOption = ref('option-a');
const selectedItem = ref('条目 B');
const selectedGroup = ref('分组 A');
const formValidate = reactive({});
const ruleValidate = reactive({});

const handleChange = (a) => {
	console.log(a);
};

onUpdated(() => {
	console.log({
		single: isSelected.value,
		phone: selectedOption.value,
		selectedItem: selectedItem.value,
		city: selectedGroup.value
	});
});

</script>
