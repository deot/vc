<template>
	<div class="vcm-touch-basic">
		<MTouch
			@tap="setEvent('单击')"
			@double-tap="setEvent('双击')"
			@long-tap="setEvent('长按')"
			@move="handleMove"
			@swipe="setEvent('滑动')"
			@swipe-left="setEvent('左滑')"
			@swipe-right="setEvent('右滑')"
			@swipe-up="setEvent('上滑')"
			@swipe-down="setEvent('下滑')"
			@pinch="handlePinch"
			@rotate="handleRotate"
		>
			<div class="vcm-touch-basic__target" :style="transform">
				<p>事件：{{ eventType }}</p>
				<p>移动：{{ deltaX }}, {{ deltaY }}</p>
				<p>缩放：{{ scale.toFixed(2) }}</p>
				<p>旋转：{{ angle.toFixed(2) }}°</p>
			</div>
		</MTouch>
	</div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { MTouch } from '../index.m';

const eventType = ref('等待手势');
const deltaX = ref(0);
const deltaY = ref(0);
const scale = ref(1);
const angle = ref(0);

const transform = computed(() => {
	return {
		transform: `scale(${scale.value}) rotate(${angle.value}deg)`
	};
});

const setEvent = (type) => {
	eventType.value = type;
};

const handleMove = (event) => {
	eventType.value = '移动';
	deltaX.value = event.deltaX;
	deltaY.value = event.deltaY;
};

const handlePinch = (event) => {
	eventType.value = '缩放';
	scale.value = Math.max(0.5, scale.value + event.scale);
};

const handleRotate = (event) => {
	eventType.value = '旋转';
	angle.value += event.angle;
};
</script>

<style lang="scss">
.vcm-touch-basic {
	padding: 16px;

	&__target {
		display: flex;
		width: 320px;
		height: 320px;
		align-items: center;
		justify-content: center;
		flex-direction: column;
		background: #f2f2f2;
		user-select: none;
	}
}
</style>
