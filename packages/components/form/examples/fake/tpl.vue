<template>
	<div>
		<input :type="type" :value="modelValue" @input="handleInput">
		<slot />
	</div>
</template>

<script setup>
import { inject } from 'vue';

defineProps({
	type: String,
	modelValue: [String, Number]
});

const emit = defineEmits(['update:modelValue']);

const formItem = inject('form-item');

const handleInput = (e) => {
	emit('update:modelValue', e.target.value);

	// form表单
	formItem.change?.();
};
</script>

<style lang="scss">
</style>
