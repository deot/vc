<template>
	<IndexBar v-model="current" :data="data" :height="240" />
</template>
<script setup>
import { ref } from 'vue';
import { IndexBar } from '@deot/vc';

defineProps({ mobile: Boolean, overlayGeneration: Number });

const current = ref('B');
const data = ['A', 'B', 'C', 'D', 'E'].map(value => ({
	value,
	label: `${value} 组`,
	children: [`${value} 项 1`, `${value} 项 2`]
}));
</script>
