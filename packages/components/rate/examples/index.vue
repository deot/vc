<template>
	<div style="padding: 20px">
		<Rate
			v-model="value"
			half
			clearable
			color="#ff0000"
			:tooltips="tooltip"
		/>
		<div>value: {{ value }}</div>
		<div>typeof: {{ typeof value }}</div>
		<div>isArray: {{ Array.isArray(value) }}</div>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Rate } from '..';

const value = ref(3.5);
const tooltip = ref(['极差', '差', '一般', '好', '极好']);
</script>
