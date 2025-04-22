<template>
	<Debounce
		:wait="wait"
		tag="button"
		@click="handleClick"
	>
		{{ count }}
	</Debounce>
	<br>
	<button @click="wait += 300">wait:{{ wait }}</button>
</template>
<script lang="ts" setup>
import { ref } from 'vue';
import { Debounce } from '..';

const wait = ref(300);
const count = ref(0);
const handleClick = () => {
	count.value++;
};
</script>
