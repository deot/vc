<template>
	<div class="audit-stack">
		<div v-for="mobile in versions" :key="mobile ? 'mobile' : 'desktop'" class="audit-version">
			<div v-if="hasMobile" class="audit-version__label">{{ mobile ? '移动端 · 独立实现' : '桌面端' }}</div>
			<div :class="{ 'audit-mobile': mobile }">
				<component :is="MODULES[name]" :mobile="mobile" :overlay-generation="overlayGeneration" />
			</div>
		</div>
	</div>
</template>
<script setup>
import { computed } from 'vue';
import { MODULES } from './modules';
import { MOBILE_COMPONENTS, MOBILE_ONLY } from './catalogue';

const props = defineProps({
	name: { type: String, required: true },
	platform: { type: String, default: 'all' },
	overlayGeneration: Number
});
const hasMobile = computed(() => MOBILE_COMPONENTS.has(props.name));
const versions = computed(() => {
	if (!hasMobile.value || props.platform === 'desktop') return [false];
	return props.platform === 'mobile' || MOBILE_ONLY.has(props.name) ? [true] : [false, true];
});
</script>
