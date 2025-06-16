<template>
	<div style="display: flex; flex-direction: column;">
		<!-- single -->
		<MRadio v-model="single" @change="handleChange">
			{{ single }}
		</MRadio>

		<!-- group -->
		<MRadioGroup v-model="phone">
			<MRadio value="apple" disabled>
				<span>Apple</span>
			</MRadio>
			<MRadio value="android">
				<span>Android</span>
			</MRadio>
			<MRadio value="windows">
				<span>Windows</span>
			</MRadio>
		</MRadioGroup>
		<MRadioGroup v-model="animal" vertical>
			<MRadio value="金斑蝶" />
			<MRadio value="爪哇犀牛" />
			<MRadio value="印度黑羚" />
		</MRadioGroup>

		<MRadioGroup v-model="city" type="button" @change="handleChange">
			<MRadio value="北京" />
			<MRadio value="上海" disabled />
			<MRadio value="深圳" />
			<MRadio value="杭州" />
		</MRadioGroup>
		<MForm
			ref="formValidate"
			:model="formValidate"
			:rules="ruleValidate"
			:label-width="96"
			style="padding-left: 56px; margin-top: 21px"
			@submit.prevent
		>
			<MFormItem prop="animal" label="动物：">
				<MRadioGroup v-model="formValidate.animal">
					<MRadio value="金斑蝶" />
					<MRadio value="爪哇犀牛" />
					<MRadio value="印度黑羚" />
				</MRadioGroup>
			</MFormItem>
			<MFormItem prop="animal" label="动物：">
				<MRadio value="金斑蝶" />
			</MFormItem>
			<MFormItem prop="input" label="动物：">
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

const single = ref(false);
const phone = ref('apple');
const animal = ref('爪哇犀牛');
const city = ref('北京');
const formValidate = reactive({});
const ruleValidate = reactive({});

const handleChange = (a) => {
	console.log(a);
};

onUpdated(() => {
	console.log({
		single: single.value,
		phone: phone.value,
		animal: animal.value,
		city: city.value
	});
});

</script>
