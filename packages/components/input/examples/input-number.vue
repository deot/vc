<template>
	<h1>value: {{ current }}</h1>
	<h1>typeof: {{ current.map(i => typeof i) }}</h1>
	<InputNumber
		v-model="current[0]"
		ref="input"
		:step="1"
		placeholder="请输入"
		clearable
		@clear="handleClear"
		@input="handleInput"
		@change="handleChange"
		@focus="handleFocus"
		@blur="handleBlur"
		@enter="handleEnter"
	/>
	<InputNumber
		controllable
		placeholder="完全受控失焦后为modelValue值"
		clearable
		@clear="handleClear"
		@input="handleInput"
		@change="handleChange"
		@focus="handleFocus"
		@blur="handleBlur"
		@enter="handleEnter"
	/>
	<InputNumber
		:model-value="current[0]"
		ref="input"
		:step="1"
		placeholder="请输入"
		clearable
		@clear="handleClear"
		@input="handleInput"
		@change="handleChange"
		@focus="handleFocus"
		@blur="handleBlur"
		@enter="handleEnter"
	/>
	<InputNumber
		:model-value="current[0]"
		ref="input"
		:step="false"
		:maxlength="4"
		placeholder="请输入"
		clearable
		@clear="handleClear"
		@input="handleInput"
		@change="handleChange"
		@focus="handleFocus"
		@blur="handleBlur"
		@enter="handleEnter"
	/>
</template>
<script setup>
import { ref } from 'vue';
import { InputNumber } from '..';

const input = ref();
const current = ref(Array.from({ length: 2 }).map(() => 'any'));

const logger = (source, ...rest) => {
	console.log(`%c [${source}]`, 'color: red; font-weight: bold', ...rest);
};

const handleInput = () => {
	logger('input', current.value);
};

const handleChange = () => {
	logger('change', current.value);
};

const handleFocus = () => {
	logger('focus', current.value);
};

const handleBlur = (_e, v, old) => {
	logger('blur', current.value, v, old, input.value);
};

const handleEnter = () => {
	logger('enter', current.value);
};
const handleClear = () => {
	logger('clear');
};
</script>

<style>
.vc-input {
	margin-bottom: 10px;
	width: 200px;
	display: block;
}
</style>
