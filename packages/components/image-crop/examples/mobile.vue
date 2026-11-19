<template>
	<div class="m-image-crop-demo">
		<h3>open()：全屏裁剪（头像）</h3>
		<div class="m-image-crop-demo__row">
			<MButton size="small" type="primary" @click="handleOpen({ shape: 'circle' })">圆形头像</MButton>
			<MButton size="small" @click="handleOpen({ aspectRatio: 16 / 9 })">16 : 9</MButton>
			<MButton size="small" @click="handleOpen({ aspectRatio: null, resizable: true })">自由裁剪</MButton>
		</div>
		<label class="m-image-crop-demo__file">
			<input type="file" accept="image/*" @change="handleFileChange">
		</label>

		<h3>内嵌：单指平移、双指缩放</h3>
		<MImageCrop
			ref="target"
			v-model:zoom="zoom"
			v-model:rotate="rotate"
			:src="src"
			:resizable="resizable"
			:aspect-ratio="resizable ? null : 1"
			@change="handleChange"
		/>
		<div class="m-image-crop-demo__controls">
			<MSlider v-model="zoom" :min="1" :max="4" :step="0.01" />
			<div class="m-image-crop-demo__row">
				<MButton size="small" @click="rotate -= 90">旋转</MButton>
				<MButton size="small" @click="target.reset()">还原</MButton>
				<MButton size="small" @click="resizable = !resizable">resizable: {{ resizable }}</MButton>
				<MButton size="small" type="primary" @click="handleExport">导出</MButton>
			</div>
		</div>

		<p v-if="data" class="m-image-crop-demo__text">
			{{ data.width.toFixed(0) }} × {{ data.height.toFixed(0) }} @ ({{ data.x.toFixed(0) }}, {{ data.y.toFixed(0) }}), {{ data.rotate }}°
		</p>
		<p class="m-image-crop-demo__text">{{ status }}</p>
		<img v-if="result" :src="result" alt="裁剪结果" :class="{ 'is-circle': isCircle }">
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { MImageCrop } from '../index.m';
import { MButton } from '../../button/index.m';
import { MSlider } from '../../slider/index.m';

const src = ref('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
	<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200" viewBox="0 0 900 1200">
		<rect width="900" height="1200" fill="#f3f5f8"/>
		<circle cx="450" cy="460" r="250" fill="#456cf6"/>
		<circle cx="370" cy="420" r="44" fill="#fff"/>
		<circle cx="530" cy="420" r="44" fill="#fff"/>
		<path d="M330 560 C390 630 510 630 570 560" fill="none" stroke="#fff" stroke-width="30" stroke-linecap="round"/>
		<path d="M0 960 C180 860 300 960 450 860 C620 750 750 890 900 800 L900 1200 L0 1200 Z" fill="#52b788"/>
	</svg>
`));

const target = ref(null);
const zoom = ref(1);
const rotate = ref(0);
const resizable = ref(false);
const data = ref(null);
const result = ref('');
const status = ref('');
const isCircle = ref(false);

const handleChange = (value) => {
	data.value = value;
};

const handleFileChange = (event) => {
	const file = event.target.files?.[0];
	file && (src.value = file);
	event.target.value = '';
};

const handleExport = async () => {
	const { dataURL } = await target.value.getImage({ width: 375 });
	isCircle.value = false;
	result.value = dataURL;
};

const handleOpen = async (options) => {
	try {
		const { dataURL } = await MImageCrop.open({ src: src.value, width: 375, ...options });
		isCircle.value = options.shape === 'circle';
		result.value = dataURL;
		status.value = 'open 完成';
	} catch {
		status.value = 'open 已取消';
	}
};
</script>
<style scoped>
.m-image-crop-demo {
	padding: 16px;
}

.m-image-crop-demo h3 {
	margin: 20px 0 12px;
	font-size: 15px;
}

.m-image-crop-demo__row {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
}

.m-image-crop-demo__file {
	display: block;
	margin-top: 12px;
	font-size: 13px;
}

.m-image-crop-demo__controls {
	display: grid;
	gap: 16px;
	margin-top: 16px;
}

.m-image-crop-demo__text {
	margin: 12px 0 0;
	font-size: 13px;
	color: #86909c;
}

.m-image-crop-demo img {
	display: block;
	width: 160px;
	margin-top: 12px;
}

.m-image-crop-demo img.is-circle {
	border-radius: 50%;
}
</style>
