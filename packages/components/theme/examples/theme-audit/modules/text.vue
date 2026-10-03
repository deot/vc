<template>
	<div class="audit-stack">
		<div v-for="token in tokens" :key="token" class="audit-sample" :data-state="token">
			<div class="audit-sample__label">{{ token }}</div>
			<div :style="{ color: `var(--vc-${token})` }">
				<Text :value="`${token}：继承正文与状态文字，长内容省略检查`" :line="1">{{ token }}：继承正文与状态文字，长内容省略检查</Text>
			</div>
		</div>
	</div>
</template>
<script setup>
import { Text } from '@deot/vc';

defineProps({ mobile: Boolean, overlayGeneration: Number });
const tokens = ['foreground-color', 'foreground-color-light', 'foreground-color-inactive', 'color-primary', 'color-success', 'color-error'];
</script>
