<template>
	<div class="audit-stack">
		<div v-for="status in ['default', 'success', 'error']" :key="status" class="audit-sample" :data-state="status">
			<div class="audit-sample__label">{{ status }}</div>
			<div class="audit-stack">
				<Progress :percent="status === 'success' ? 100 : 55" :status="status" />
				<Progress type="circle" :percent="status === 'success' ? 100 : 55" :status="status" :width="80" />
			</div>
		</div>
		<div class="audit-sample" data-state="活跃动画 / 显式轨道对照">
			<div class="audit-sample__label">活跃动画 / 显式轨道对照</div>
			<div class="audit-stack">
				<Progress :percent="65" active />
				<Progress :percent="65" track-color="#64758B" />
			</div>
		</div>
	</div>
</template>
<script setup>
import { Progress } from '@deot/vc';

defineProps({ mobile: Boolean, overlayGeneration: Number });
</script>
