<template>
	<div class="audit-stack">
		<Debounce :tag="Button" :wait="600" @click="count++">快速点击：600ms 内只执行一次</Debounce>
		<p>已执行 {{ count }} 次</p>
		<p class="audit-hint">继承主题：防抖组件不提供自己的配色。</p>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Debounce, Button } from '@deot/vc';

const count = ref(0);
</script>
