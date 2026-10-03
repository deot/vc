<template>
	<div class="audit-stack">
		<div v-for="shadow in [true, false]" :key="String(shadow)" class="audit-sample" :data-state="`shadow: ${shadow} · hover`">
			<div class="audit-sample__label">shadow: {{ shadow }} · hover</div>
			<Card :shadow="shadow" title="卡片标题" border>
				观察表面、分隔线、边框与 hover 阴影
				<template #extra>更多</template>
				<template #footer>底部内容</template>
			</Card>
		</div>
	</div>
</template>
<script setup>
import { Card } from '@deot/vc';

defineProps({ mobile: Boolean, overlayGeneration: Number });
</script>
