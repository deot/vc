<template>
	<div style="display: flex; flex-direction: column;">
		<!-- single -->
		<MRadio v-model="isSelected" @change="handleChange">
			{{ isSelected }}
		</MRadio>

		<!-- group -->
		<MRadioGroup v-model="selectedOption">
			<MRadio value="option-a" disabled>
				<span>选项 A</span>
			</MRadio>
			<MRadio value="option-b">
				<span>选项 B</span>
			</MRadio>
			<MRadio value="option-c">
				<span>选项 C</span>
			</MRadio>
		</MRadioGroup>
		<MRadioGroup v-model="selectedItem" vertical>
			<MRadio value="条目 A" />
			<MRadio value="条目 B" />
			<MRadio value="条目 C" />
		</MRadioGroup>

		<MRadioGroup v-model="selectedGroup" type="button" @change="handleChange">
			<MRadio value="分组 A" />
			<MRadio value="分组 B" disabled />
			<MRadio value="分组 C" />
			<MRadio value="分组 D" />
		</MRadioGroup>
		<MForm
			ref="formValidate"
			:model="formValidate"
			:rules="ruleValidate"
			:label-width="96"
			style="padding-left: 56px; margin-top: 21px"
			@submit.prevent
		>
			<MFormItem prop="selectedItem" label="条目：">
				<MRadioGroup v-model="formValidate.selectedItem">
					<MRadio value="条目 A" />
					<MRadio value="条目 B" />
					<MRadio value="条目 C" />
				</MRadioGroup>
			</MFormItem>
			<MFormItem prop="selectedItem" label="条目：">
				<MRadio value="条目 A" />
			</MFormItem>
			<MFormItem prop="input" label="条目：">
				<MInput style="width: 300px" />
			</MFormItem>
		</MForm>
	</div>
</template>
<script setup>
import { onUpdated, ref, reactive } from 'vue';
import { MRadio, MRadioGroup } from '../index.m';
import { MForm, MFormItem } from '../../form/index.m';
import { MInput } from '../../input/index.m';

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
