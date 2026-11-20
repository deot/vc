<template>
	<MTabBar v-model="value" :data="data" />
</template>
<script setup>
import { ref } from 'vue';
import { MTabBar } from '@deot/vc';

defineProps({ mobile: Boolean, overlayGeneration: Number });

const value = ref('message');
const data = [
	{ value: 'home', label: '首页', icon: 'grid' },
	{ value: 'message', label: '消息', icon: 'notice', badge: 8 },
	{ value: 'mine', label: '我的', icon: 'account', badge: true }
];
</script>
