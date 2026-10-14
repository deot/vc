<template>
	<div class="audit-stack">
		<div class="audit-sample" data-state="默认颜色">
			<div class="audit-sample__label">默认颜色</div>
			<Watermark value="示例水印" :gap="40">
				<div class="audit-loading-surface">切换主题后水印仍可见</div>
			</Watermark>
		</div>
		<div class="audit-sample" data-state="跟随主题色">
			<div class="audit-sample__label">跟随主题色</div>
			<Watermark value="示例水印" :gap="40" :style="{ color: 'var(--vc-color-primary)', opacity: 0.3 }">
				<div class="audit-loading-surface">修改主色后水印重绘</div>
			</Watermark>
		</div>
	</div>
</template>
<script setup>
import { Watermark } from '@deot/vc';

defineProps({ mobile: Boolean, overlayGeneration: Number });
</script>
