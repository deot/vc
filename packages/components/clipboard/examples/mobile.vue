<template>
	<div>
		<input v-model="msg" type="text">
		<br>
		<MClipboard
			:value="msg"
			tag="span"
			@before="handleBefore"
			@after="handleAfter"
		>
			复制
		</MClipboard>
		<br>
		<br>
		<br>
		<MClipboard :value="msg">
			简洁版复制
		</MClipboard>
		<div @click="handleClick">api</div>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { MToast } from '../../toast/index.m';
import { MClipboard } from '../index.m';

const msg = ref('copy');
const handleAfter = (value) => {
	MToast.info({
		content: `复制成功：${value}`
	});
	return value;
};

const handleBefore = (e, value) => {
	return value + 'before';
};

const handleClick = () => {
	MClipboard.set(msg.value);
};
</script>
