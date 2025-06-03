<template>
	<DatePicker
		v-model="value"
		type="month"
		clearable
		confirm
		placeholder="Select date"
		style="width: 300px"
	/>
	<div>value: {{ value }}</div>
	<div>typeof: {{ typeof value }}</div>
	<div>isArray: {{ Array.isArray(value) }}</div>
</template>
<script setup>
import { ref } from 'vue';
import { DatePicker } from '..';

const value = ref([]);

</script>
