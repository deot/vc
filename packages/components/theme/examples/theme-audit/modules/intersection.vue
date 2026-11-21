<template>
	<div class="audit-stack">
		<p>状态：{{ visible ? '在可视区内' : '不在可视区' }}</p>
		<div class="audit-intersection">
			<div class="audit-intersection__space" />
			<Intersection v-model="visible" class="audit-utility-surface">
				监听区域 · 继承主题
			</Intersection>
			<div class="audit-intersection__space" />
		</div>
		<p class="audit-hint">滚动上方区域，检查状态随监听区域进出切换。</p>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Intersection } from '@deot/vc';

const visible = ref(false);
</script>
<style scoped>
.audit-intersection {
	height: 140px;
	overflow: auto;
}

.audit-intersection__space {
	height: 200px;
}
</style>
