<template>
	<div class="vcm-image-crop-example">
		<MImageCrop
			ref="target"
			class="vcm-image-crop-example__canvas"
			:src="src"
			:scale="scale"
			:rotate="rotate"
			:border="[24, 24]"
			:output-size="outputSize"
			@image-load="handleImageLoad"
			@image-error="handleImageError"
			@image-drop="handleImageDrop"
			@position-change="handlePositionChange"
		/>

		<section class="vcm-image-crop-example__controls">
			<label>
				<span>Scale</span>
				<MSlider v-model="scale" :min="0.3" :max="3" :step="0.01" />
			</label>
			<label>
				<span>Rotate</span>
				<MSlider v-model="rotate" :min="0" :max="360" />
			</label>
			<div class="vcm-image-crop-example__actions">
				<input type="file" accept="image/*" @change="handleFileChange">
				<MButton type="primary" @click="handleRotate">
					Rotate
				</MButton>
				<MButton type="primary" @click="handleSave">
					Export
				</MButton>
			</div>
		</section>

		<section class="vcm-image-crop-example__result">
			<p>{{ status }}</p>
			<p>{{ positionText }}</p>
			<img v-if="result" :src="result" alt="crop result">
		</section>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { MImageCrop } from '../index.m';
import { MButton } from '../../button/index.m';
import { MSlider } from '../../slider/index.m';

const createDemoImage = () => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
	<svg xmlns="http://www.w3.org/2000/svg" width="900" height="900" viewBox="0 0 900 900">
		<rect width="900" height="900" fill="#f3f5f8"/>
		<circle cx="450" cy="320" r="190" fill="#456cf6"/>
		<circle cx="330" cy="280" r="58" fill="#ffffff"/>
		<circle cx="570" cy="280" r="58" fill="#ffffff"/>
		<path d="M240 600 C330 700 570 700 660 600" fill="none" stroke="#1f2633" stroke-width="42" stroke-linecap="round"/>
		<path d="M0 720 C180 620 300 720 450 620 C620 510 750 650 900 560 L900 900 L0 900 Z" fill="#52b788"/>
	</svg>
`);

const target = ref(null);
const src = ref(createDemoImage());
const scale = ref(1);
const rotate = ref(0);
const outputSize = ref(750);
const result = ref('');
const status = ref('Ready');
const positionText = ref('');

const handleFileChange = (event) => {
	const file = event.target.files?.[0];
	if (file) {
		src.value = file;
	}
	event.target.value = '';
};

const handleRotate = () => {
	rotate.value = (rotate.value + 90) % 360;
};

const handleSave = async () => {
	const { dataURL } = await target.value.getImage();
	result.value = dataURL;
};

const handleImageLoad = (image) => {
	status.value = `Loaded ${Math.round(image.width)} x ${Math.round(image.height)}`;
};

const handleImageError = () => {
	status.value = 'Image error';
};

const handleImageDrop = () => {
	status.value = 'Image dropped';
};

const handlePositionChange = (position) => {
	positionText.value = `x ${position.x.toFixed(3)}, y ${position.y.toFixed(3)}`;
};
</script>
<style scoped>
.vcm-image-crop-example {
	padding: 16px;
}

.vcm-image-crop-example__canvas {
	width: 100%;
}

.vcm-image-crop-example__controls {
	display: grid;
	gap: 18px;
	margin-top: 20px;
}

.vcm-image-crop-example__controls label {
	display: grid;
	gap: 8px;
	font-size: 13px;
	color: #475467;
}

.vcm-image-crop-example__actions {
	display: flex;
	flex-wrap: wrap;
	gap: 10px;
	align-items: center;
}

.vcm-image-crop-example__result {
	margin-top: 20px;
	font-size: 13px;
	color: #475467;
}

.vcm-image-crop-example__result p {
	margin: 0 0 8px;
}

.vcm-image-crop-example__result img {
	width: 100%;
	border: 1px solid #d9dde7;
	box-sizing: border-box;
}
</style>
