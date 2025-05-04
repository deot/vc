<template>
	<div style="display: flex; flex-direction: column;">
		<!-- single -->
		<Radio v-model="single" @change="handleChange">
			{{ single }}
		</Radio>

		<!-- group -->
		<RadioGroup v-model="phone">
			<Radio label="apple" disabled>
				<span>Apple</span>
			</Radio>
			<Radio label="android">
				<span>Android</span>
			</Radio>
			<Radio label="windows">
				<span>Windows</span>
			</Radio>
		</RadioGroup>
		<RadioGroup v-model="animal" vertical>
			<Radio label="金斑蝶" />
			<Radio label="爪哇犀牛" />
			<Radio label="印度黑羚" />
		</RadioGroup>

		<RadioGroup v-model="city" type="button" @change="handleChange">
			<Radio label="北京" />
			<Radio label="上海" disabled />
			<Radio label="深圳" />
			<Radio label="杭州" />
		</RadioGroup>
		<Form
			ref="formValidate"
			:model="formValidate"
			:rules="ruleValidate"
			:label-width="96"
			style="padding-left: 56px; margin-top: 21px"
			@submit.prevent
		>
			<FormItem prop="animal" label="动物：">
				<RadioGroup v-model="formValidate.animal">
					<Radio label="金斑蝶" />
					<Radio label="爪哇犀牛" />
					<Radio label="印度黑羚" />
				</RadioGroup>
			</FormItem>
			<FormItem prop="animal" label="动物：">
				<Radio label="金斑蝶" />
			</FormItem>
			<FormItem prop="input" label="动物：">
				<Input style="width: 300px" />
			</FormItem>
		</Form>
	</div>
</template>
<script setup>
import { onUpdated, ref, reactive } from 'vue';
import { Radio, RadioGroup } from '..';
import { Form, FormItem } from '../../form/index';
import { Input } from '../../input/index';

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
