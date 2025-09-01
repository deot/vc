<template>
	<div class="vc-portal-alive">
		<button @click="handleClick">
			Alive
		</button>
	</div>
</template>
<script setup>
import { ref, onMounted } from 'vue';
import { Alive } from './alive';

const count = ref(0);

const handleClick = async () => {
	try {
		const status = await Alive.popup({
			id: count.value,
			title: `Hello world - ${count.value++}`
		});
		console.log(`${status}`);
	} catch (status) {
		console.log(`${status}`);
	}
};

onMounted(handleClick);
</script>
