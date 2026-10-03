<template>
	<div class="audit-stack">
		<p class="audit-hint">继承主题：短内容、长内容及自动滚动。此组件只提供横向跑马灯。</p>
		<Marquee class="audit-utility-surface" content="短内容" />
		<Marquee class="audit-utility-surface" :content="content" :autoplay="playing" />
		<Button @click="playing = !playing">{{ playing ? '停止自动滚动' : '自动滚动' }}</Button>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Marquee, Button } from '@deot/vc';

const playing = ref(false);
const content = '长内容继承正文颜色，在亮色和暗色表面上检查文字可读性。'.repeat(4);
</script>
