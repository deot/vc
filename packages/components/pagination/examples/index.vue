<template>
	<Pagination
		v-model:current="current"
		:count="100000"
		show-count
		show-elevator
		show-sizer
	/>
</template>
<script setup>
import { ref, onUpdated } from 'vue';
import { Pagination } from '..';

const current = ref(3);

onUpdated(() => {
	console.log(current.value);
});
</script>
