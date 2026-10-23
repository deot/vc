<template>
	<div class="audit-stack">
		<Gesture
			@tap="event = '单击'" @double-tap="event = '双击'" @long-tap="event = '长按'"
			@swipe="event = '滑动'" @pinch="event = '缩放'" @rotate="event = '旋转'"
		>
			<div class="audit-utility-surface audit-gesture">手势区域 · {{ event }}</div>
		</Gesture>
		<p class="audit-hint">继承主题；鼠标、触屏或浏览器触摸模拟都可以检查手势。</p>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Gesture } from '@deot/vc';

const event = ref('等待手势');
</script>
