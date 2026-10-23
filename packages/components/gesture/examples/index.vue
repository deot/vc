<template>
	<div class="vc-gesture-basic">
		<Gesture
			class="vc-gesture-basic__area"
			@tap="handleSetEvent('单击')"
			@double-tap="handleSetEvent('双击')"
			@long-tap="handleSetEvent('长按')"
			@move="handleMove"
			@move-end="handleMoveEnd"
			@swipe="handleSwipe"
			@pinch-start="handlePinchStart"
			@pinch="handlePinch"
			@rotate="handleRotate"
			@wheel="handleWheel"
		>
			<div class="vc-gesture-basic__target" :style="transform">
				<p>事件：{{ eventType }}</p>
				<p>位移：{{ x.toFixed(0) }}, {{ y.toFixed(0) }}</p>
				<p>缩放：{{ scale.toFixed(2) }}</p>
				<p>旋转：{{ angle.toFixed(2) }}°</p>
			</div>
		</Gesture>
	</div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { Gesture } from '..';

const eventType = ref('等待手势');
const x = ref(0);
const y = ref(0);
const scale = ref(1);
const angle = ref(0);
let base = 1;

const transform = computed(() => ({
	transform: `translate(${x.value}px, ${y.value}px) scale(${scale.value}) rotate(${angle.value}deg)`
}));

const handleSetEvent = (type) => {
	eventType.value = type;
};

const handleMove = (e) => {
	eventType.value = '移动';
	x.value += e.deltaX;
	y.value += e.deltaY;
};

const handleMoveEnd = (e) => {
	eventType.value = `松开（速度 ${Math.hypot(e.velocityX, e.velocityY).toFixed(2)} px/ms）`;
};

const handleSwipe = (e) => {
	eventType.value = `滑动：${e.direction}`;
};

const handlePinchStart = () => {
	base = scale.value;
};

const handlePinch = (e) => {
	eventType.value = '缩放';
	scale.value = Math.max(0.5, base * e.scale);
};

const handleRotate = (e) => {
	eventType.value = '旋转';
	angle.value += e.angle;
};

const handleWheel = (e) => {
	eventType.value = '滚轮';
	scale.value = Math.max(0.5, scale.value * Math.exp(-e.deltaY * 0.002));
};
</script>

<style lang="scss">
.vc-gesture-basic {
	padding: 16px;

	&__area {
		display: flex;
		width: 320px;
		height: 320px;
		overflow: hidden;
		background: #f2f2f2;
		align-items: center;
		justify-content: center;
	}

	&__target {
		text-align: center;
	}
}
</style>
