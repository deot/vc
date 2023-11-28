<template>
	<h1>{{ value }}</h1>
	<Input
		v-model="value[0]"
		:disabled="disabled"
		:maxlength="2"
		bytes
		clearable
		placeholder="显示placeholder"
		indicator
		@change="handleChange"
		@focus="handleFocus"
		@blur="handleBlur"
		@enter="handleEnter"
	/>
</template>
<script setup>
import { ref } from 'vue';
import { Input } from '..';

const disabled = ref(false);
const value = ref(Array.from({ length: 6 }).map(() => 'any'));

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
</script>

<style>
.vc-input {
	margin-bottom: 10px;
	width: 200px;
	display: block;
}
</style>