<template>
	<h1>{{ value }}</h1>
	<InputNumber 
		v-model="value[0]" 
		:step="1"
		:precision="0" 
		:min="1000"
		:disabled="disabled"
		clearable
		@clear="handleClear"
		@change="handleChange"
		@focus="handleFocus"
		@blur="handleBlur"
		@enter="handleEnter"
	/>
	<InputNumber 
		v-model="value[1]" 
		:step="1"
		:precision="0" 
		:min="1000"
		:disabled="disabled"
		clearable
		styleless
		@clear="handleClear"
		@change="handleChange"
		@focus="handleFocus"
		@blur="handleBlur"
		@enter="handleEnter"
	/>
</template>
<script setup>
import { ref } from 'vue';
import { InputNumber } from '..';

const disabled = ref(false);
const value = ref(Array.from({ length: 2 }).map(() => 11));

const handleChange = () => {
	console.log(value);
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
const handleClear = () => {
	console.log('Clear');
};
</script>

<style>
.vc-input {
	margin-bottom: 10px;
	width: 200px;
	display: block;
}
</style>