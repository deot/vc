<template>
	<div class="audit-stack">
		<div v-for="(item, index) in states" :key="index" class="audit-sample" :data-state="item.label">
			<div class="audit-sample__label">{{ item.label }}</div>
			<Slider v-model="item.value" :range="item.range" :disabled="item.disabled" show-stops :step="10" />
		</div>
	</div>
</template>
<script setup>
import { reactive } from 'vue';
import { Slider } from '@deot/vc';

defineProps({ mobile: Boolean, overlayGeneration: Number });
const states = reactive([false, true].flatMap(disabled => [false, true].map(range => ({
	label: `${range ? '范围' : '单值'}${disabled ? ' · 禁用' : ' · 拖动观察浮层'}`,
	value: range ? [25, 65] : 40, range, disabled
}))));
</script>
