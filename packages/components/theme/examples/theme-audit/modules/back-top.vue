<template>
	<div class="audit-stack">
		<p>状态：{{ visible ? '已显示' : '未显示' }}</p>
		<div class="audit-utility-surface audit-back-top">
			<div class="audit-back-top__space">向下滚动超过 100px 后，按钮出现在区域右下角 · 继承主题</div>
			<BackTop v-model="visible" :visibility-height="100" :right="16" :bottom="16" />
		</div>
		<p class="audit-hint">检查按钮的底色、图标色、阴影与悬停色在两种主题下的对比。</p>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { BackTop } from '@deot/vc';

const visible = ref(false);
</script>
<style scoped>
.audit-back-top {
	height: 160px;
	overflow: auto;
}

.audit-back-top__space {
	height: 600px;
}
</style>
