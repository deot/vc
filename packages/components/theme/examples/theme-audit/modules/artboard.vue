<template>
	<div class="audit-stack">
		<Button @click="isCanvasVisible = !isCanvasVisible">{{ isCanvasVisible ? '收起画板' : '初始化画板' }}</Button>
		<Artboard v-if="isCanvasVisible" ref="artboard" :width="280" :height="150" />
		<p v-else class="audit-hint">绘图颜色保持用户配置，主题只影响外框。</p>
		<div class="audit-row">
			<Button @click="artboard?.reset()">清空</Button>
			<Button @click="artboard?.undo()">撤销</Button>
		</div>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Artboard, Button } from '@deot/vc';

defineProps({ mobile: Boolean, overlayGeneration: Number });
const artboard = ref();
const isCanvasVisible = ref(false);
</script>
