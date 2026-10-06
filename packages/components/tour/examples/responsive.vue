<template>
	<div style="padding: 16px">
		<label>预览宽度 <select v-model="previewWidth"><option :value="375">375px</option><option :value="768">768px</option></select></label>
		<p>在独立视口中验证卡片翻转、宽度限制和亮暗主题。</p>
		<iframe
			title="Tour 窄视口预览" src="./index.html"
			:style="{ width: `${previewWidth}px`, maxWidth: '100%', height: '700px', border: '1px solid var(--vc-border-color)' }"
		/>
	</div>
</template>
<script setup>
import { ref } from 'vue';

const previewWidth = ref(375);
</script>
