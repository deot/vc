<template>
	<div class="audit-stack">
		<Print ref="target"><div class="audit-utility-surface">主题打印内容<br>普通正文、主题背景与边框。</div></Print>
		<Button @click="target.print()">打印此示例</Button>
		<p class="audit-hint">继承主题；只有点击才打开打印窗口，不打印整个调试页。</p>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Print, Button } from '@deot/vc';

const target = ref();
</script>
