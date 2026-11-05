<template>
	<div>
		<h2>状态对比</h2>
		<div class="textarea-state-examples">
			<MTextarea placeholder="普通移动端文本域" />
			<MTextarea disabled placeholder="禁用移动端文本域：空值" />
			<MTextarea disabled model-value="禁用移动端文本域：已有内容" />
		</div>
	</div>
</template>
<script setup>
import { MTextarea } from '../index.m';
</script>
<style scoped>
.textarea-state-examples {
	display: flex;
	flex-direction: column;
	gap: 12px;
}
</style>
