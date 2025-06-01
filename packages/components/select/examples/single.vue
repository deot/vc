<template>
	<Select
		v-model="value"
		:data="cityList"
		clearable
		searchable
		style="width: 200px"
		@change="handleChange"
		@ready="handleReady"
		@close="handleClose"
		@visible-change="handleVisibleChange"
	/>
	<div>value: {{ value }}</div>
	<div>typeof: {{ typeof value }}</div>
	<div>isArray: {{ Array.isArray(value) }}</div>
</template>
<script setup>
import { ref } from 'vue';
import { Select } from '..';

import { cityList } from './basic/data';

const value = ref(null);

const handleChange = (v) => {
	console.log(v);
};

const handleReady = () => {
	console.log('ready');
};

const handleClose = () => {
	console.log('close');
};

const handleVisibleChange = (v) => {
	console.log('visible-change', v);
};
</script>
