<template>
	<div @click="handleClick">Hello World! {{ type }}</div>
</template>
<script lang="ts" setup>
defineProps({
	type: String
});
const handleClick = (e: any) => {
	
}
</script>
<style>
	div {
		color: red;
	}
</style>