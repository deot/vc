<template>
	<div>
		<Textarea
			v-model="value"
			placeholder="显示placeholder"
			@change="handleChange"
			@focus="handleFocus"
			@blur="handleBlur"
			@enter="handleEnter"
		/>
		<br>	
		<br>	
		<br>	
		<br>	
		<Form
			ref="formValidate" 
			:label-width="96"
			style="padding-left: 56px; margin-top: 21px"
			@submit.prevent
		>
			<FormItem label="test">
				<Textarea
					v-model="value"
					:autosize="{ maxRows: 2 }"
				/>
			</FormItem>
			<FormItem label="test">
				<Textarea
					v-model="value"
				/>
			</FormItem>
			<FormItem label="test">
				<Textarea
					v-model="value"
					:autosize="{ maxRows: 2 }"
				/>
			</FormItem>
			<FormItem label="test">
				<Textarea
					v-model="value"
				/>
			</FormItem>
			<FormItem label="test1">
				<Textarea
					v-model="value"
					:maxlength="200"
					indicator
				/>
			</FormItem>
		</Form>
	</div>
</template>
<script setup>
import {ref } from 'vue';
import { Textarea } from '..';
import { Form, FormItem } from '../../form/index';

const value = ref('');

setTimeout(() => {
	value.value = 9999;
}, 3000);

const handleChange = () => {
	console.log(value.value);
};

const handleFocus = () => {
	console.log('聚焦的回调');
};

const handleBlur = () => {
	console.log('失焦的回调');
};

const handleEnter = () => {
	console.log('回车键的回调');
};
</script>
