<template>
	<div>
		<input v-model="msg" type="text">
		<br>
		<Clipboard
			:value="msg"
			tag="span"
			@before="handleBefore"
			@after="handleAfter"
		>
			复制
		</Clipboard>
		<br>
		<br>
		<br>
		<Clipboard :value="msg">
			简洁版复制
		</Clipboard>
		<div @click="handleClick">api</div>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Message } from '../../message';
import { Clipboard } from '..';

const msg = ref('copy');
const handleAfter = (value) => {
	Message.success({
		content: `复制成功：${value}`
	});
	return value;
};

const handleBefore = (e, value) => {
	return value + 'before';
};

const handleClick = () => {
	Clipboard.set(msg.value);
};
</script>
