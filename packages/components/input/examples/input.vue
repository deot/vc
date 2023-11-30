<template>
	<h1>{{ current }}</h1>
	<Input
		v-model="current[0]"
		:disabled="disabled"
		:maxlength="2"
		bytes
		clearable
		placeholder="显示placeholder"
		indicator
		@input="handleInput"
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
const current = ref(Array.from({ length: 6 }).map(() => 'any'));

const handleInput = () => {
	console.log('input', current.value);
};

const handleChange = () => {
	console.log('change', current.value);
};

const handleFocus = () => {
	console.log('focus', current.value);
};

const handleBlur = (e, v, old) => {
	console.log('blur', current.value, v, old);
};

const handleEnter = () => {
	console.log('enter', current.value);
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