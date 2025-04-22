<template>
	<h1>{{ value }}</h1>
	<InputSearch
		v-model="value[0]"
		:disabled="disabled"
		enter-text="搜索"
		clearable
		@clear="handleClear"
		@change="handleChange"
		@focus="handleFocus"
		@blur="handleBlur"
		@enter="handleEnter"
	/>
	<InputSearch
		v-model="value[1]"
		:disabled="disabled"
		focus-end
		clearable
		@clear="handleClear"
		@change="handleChange"
		@focus="handleFocus"
		@blur="handleBlur"
		@enter="handleEnter"
	/>

	<InputSearch
		v-model="value[2]"
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
import { InputSearch } from '..';

const disabled = ref(false);
const value = ref(Array.from({ length: 3 }).map(() => 'any'));

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
