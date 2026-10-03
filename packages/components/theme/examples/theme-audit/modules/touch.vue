<template>
	<div class="audit-stack">
		<Touch
			@tap="event = '单击'" @double-tap="event = '双击'" @long-tap="event = '长按'"
			@swipe="event = '滑动'" @pinch="event = '缩放'" @rotate="event = '旋转'"
		>
			<div class="audit-utility-surface audit-touch">触摸区域 · {{ event }}</div>
		</Touch>
		<p class="audit-hint">继承主题；请使用触屏或浏览器触摸模拟检查手势。</p>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Touch } from '@deot/vc';

const event = ref('等待手势');
</script>
