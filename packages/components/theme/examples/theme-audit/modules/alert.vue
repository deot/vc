<template>
	<div class="audit-stack">
		<div v-for="type in types" :key="type" class="audit-sample" :data-state="type">
			<div class="audit-sample__label">{{ type }}</div>
			<div class="audit-stack">
				<Alert v-model="visible[type]" :type="type" :title="`${type} 提示`" description="状态背景、边框、图标与普通正文" closable />
				<Alert :type="type" title="仅标题 · 不带图标" :icon="false" />
			</div>
		</div>
		<p class="audit-hint">关闭后点击卡片底部恢复。</p>
		<button class="audit-demo-button" @click="handleRestore">恢复提示</button>
	</div>
</template>
<script setup>
import { reactive } from 'vue';
import { Alert } from '@deot/vc';

defineProps({ mobile: Boolean, overlayGeneration: Number });
const types = ['info', 'success', 'warning', 'error'];
const visible = reactive(Object.fromEntries(types.map(type => [type, true])));
const handleRestore = () => types.forEach((type) => { visible[type] = true; });
</script>
