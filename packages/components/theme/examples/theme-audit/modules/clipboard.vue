<template>
	<div class="audit-stack">
		<Input v-model="value" />
		<Clipboard :tag="Button" :value="value" @after="status = '复制成功'" @error="status = '复制失败'">复制示例文字</Clipboard>
		<p role="status">{{ status }}</p>
		<p class="audit-hint">继承主题：用 Button 作为复制控件，不自动弹出全局消息。</p>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Clipboard, Button, Input } from '@deot/vc';

const value = ref('主题复制示例');
const status = ref('尚未复制');
</script>
