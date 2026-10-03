<template>
	<div class="audit-stack">
		<div class="audit-sample" data-state="三个尺寸">
			<div class="audit-sample__label">三个尺寸</div>
			<div class="audit-row"><Spin v-for="size in [16, 28, 40]" :key="size" :size="size" /></div>
		</div>
		<div class="audit-sample" data-state="容器加载覆盖">
			<div class="audit-sample__label">容器加载覆盖</div>
			<div class="audit-loading-surface"><span>加载内容</span><Spin /></div>
		</div>
		<div class="audit-sample" data-state="显式颜色对照">
			<div class="audit-sample__label">显式颜色对照</div>
			<Spin foreground="#64758B" background="#E6A23C" />
		</div>
	</div>
</template>
<script setup>
import { Spin } from '@deot/vc';

defineProps({ mobile: Boolean, overlayGeneration: Number });
</script>
