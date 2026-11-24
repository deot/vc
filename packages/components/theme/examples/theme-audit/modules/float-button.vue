<template>
	<div class="audit-stack">
		<p>位置：x {{ Math.round(offset?.x) }}，y {{ Math.round(offset?.y) }}</p>
		<div class="audit-utility-surface audit-float-button">
			<div class="audit-float-button__space">按钮限制在区域内，可自由拖动，松开后吸到左右两边 · 继承主题</div>
			<FloatButton v-model:offset="offset" draggable magnetic="x" icon="service" :gap="12" />
			<FloatButton draggable="x" shape="square" :gap="12" :offset="{ x: 0, y: 0 }">
				文字
			</FloatButton>
		</div>
		<p class="audit-hint">检查主色底、图标与文字色、阴影与悬停色在两种主题下的对比。</p>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { FloatButton } from '@deot/vc';

const offset = ref();
</script>
<style scoped>
.audit-float-button {
	height: 160px;
	overflow: auto;
}

.audit-float-button__space {
	height: 600px;
}
</style>
