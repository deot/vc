<template>
	<div style="display: flex;">
		<input 
			:type="type" 
			:value="modelValue" 
			:placeholder="placeholder"
			style="border: 1rpx solid #d9d9d9;"
			@input="handleInput"
			@blur="handleBlur"
		>
		<slot />
	</div>
</template>

<script setup>
import { inject } from 'vue';

const props = defineProps({
	type: String,
	modelValue: [String, Number],
	placeholder: String,
	allowDispatch: {
		type: Boolean,
		default: true
	}
});

const emit = defineEmits(['update:modelValue']);

const formItem = inject('vc-form-item');

const handleInput = (e) => {
	emit('update:modelValue', e.target.value);

	// form表单
	props.allowDispatch && formItem.change?.();
};

const handleBlur = (e) => {
	// form表单
	props.allowDispatch && formItem.blur?.();
}
</script>

<style lang="scss">
</style>
