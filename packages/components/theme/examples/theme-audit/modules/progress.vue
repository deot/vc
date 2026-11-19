<template>
	<div class="audit-stack">
		<div v-for="status in ['default', 'success', 'error']" :key="status" class="audit-sample" :data-state="status">
			<div class="audit-sample__label">{{ status }}</div>
			<div class="audit-stack">
				<component :is="mobile ? MProgress : Progress" :percent="status === 'success' ? 100 : 55" :status="status" />
				<component
					:is="mobile ? MProgress : Progress"
					type="circle"
					:percent="status === 'success' ? 100 : 55"
					:status="status"
					:size="mobile ? 160 : 80"
				/>
			</div>
		</div>
		<div class="audit-sample" data-state="活跃动画 / 置灰 / 条内文字 / 显式轨道对照">
			<div class="audit-sample__label">活跃动画 / 置灰 / 条内文字 / 显式轨道对照</div>
			<div class="audit-stack">
				<component :is="mobile ? MProgress : Progress" :percent="65" animated />
				<component :is="mobile ? MProgress : Progress" :percent="65" disabled />
				<component :is="mobile ? MProgress : Progress" :percent="65" text-inside />
				<component :is="mobile ? MProgress : Progress" :percent="65" track-color="#64758B" />
			</div>
		</div>
	</div>
</template>
<script setup>
import { Progress, MProgress } from '@deot/vc';

defineProps({ mobile: Boolean, overlayGeneration: Number });
</script>
