<template>
	<div class="audit-stack">
		<div v-for="token in tokens" :key="token" class="audit-sample" :data-state="token">
			<div class="audit-sample__label">{{ token }}</div>
			<div :style="{ color: `var(--vc-${token})` }">
				<div class="audit-row">
					<Icon v-for="type in ['search', 'check', 'close', 'star']" :key="type" :type="type" inherit class="audit-icon" />
				</div>
			</div>
		</div>
	</div>
</template>
<script setup>
import { Icon } from '@deot/vc';

defineProps({ mobile: Boolean, overlayGeneration: Number });
const tokens = ['foreground-color', 'foreground-color-light', 'foreground-color-inactive', 'color-primary', 'color-success', 'color-error'];
</script>
