<template>
	<div class="audit-stack">
		<Snapshot ref="target" :show-loading="false" @ready="ready = true">
			<div class="audit-utility-surface">主题截图内容<br><Tag color="primary">主题标签</Tag></div>
		</Snapshot>
		<Button :disabled="!ready" @click="handleCapture">生成预览，不下载</Button>
		<img v-if="src" :src="src" alt="主题截图预览" class="audit-result-image">
		<p v-if="error" role="alert">{{ error }}</p>
		<p class="audit-hint">继承主题；截图仅由按钮触发，结果留在本页。</p>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Snapshot, Button, Tag } from '@deot/vc';

const target = ref();
const ready = ref(false);
const src = ref('');
const error = ref('');
const handleCapture = async () => {
	try { src.value = await target.value.toDataURL('png'); error.value = ''; } catch (e) { error.value = `生成失败：${e.message}`; }
};
</script>
