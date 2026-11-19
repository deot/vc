<template>
	<div class="audit-stack">
		<div class="audit-sample" data-state="预设（图片 + 标题 + 段落）">
			<div class="audit-sample__label">预设（图片 + 标题 + 段落）</div>
			<Skeleton image />
		</div>
		<div class="audit-sample" data-state="静止">
			<div class="audit-sample__label">静止</div>
			<Skeleton :animated="false" :image="{ shape: 'circle' }" :rows="2" />
		</div>
		<div class="audit-sample" data-state="原子块">
			<div class="audit-sample__label">原子块</div>
			<div class="audit-row">
				<SkeletonItem :width="32" :height="32" shape="circle" />
				<SkeletonItem :width="120" />
				<SkeletonItem :width="64" :height="24" shape="circle" />
			</div>
		</div>
	</div>
</template>
<script setup>
import { Skeleton, SkeletonItem } from '@deot/vc';

defineProps({ mobile: Boolean, overlayGeneration: Number });
</script>
