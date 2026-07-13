<template>
	<div class="v-image-crop-example">
		<section class="v-image-crop-example__stage">
			<ImageCrop
				ref="target"
				class="v-image-crop-example__canvas"
				:src="src"
				:scale="scale"
				:rotate="rotate"
				:border="40"
				:output-size="outputSize"
				:mask-color="[0, 0, 0, 0.5]"
				cross-origin="anonymous"
				@image-drop="handleImageDrop"
				@image-error="handleImageError"
				@image-load="handleImageLoad"
				@image-change="handleImageChange"
				@position-change="handlePositionChange"
			/>
		</section>

		<section class="v-image-crop-example__controls">
			<label>
				<span>Scale</span>
				<Slider v-model="scale" :min="0.3" :max="3" :step="0.01" />
			</label>
			<label>
				<span>Rotate</span>
				<Slider v-model="rotate" :min="0" :max="360" />
			</label>
			<div class="v-image-crop-example__size">
				<label>
					<span>Width</span>
					<input v-model.number="outputWidth" type="number" min="1">
				</label>
				<label>
					<span>Height</span>
					<input v-model.number="outputHeight" type="number" min="1">
				</label>
			</div>
			<div class="v-image-crop-example__actions">
				<input type="file" accept="image/*" @change="handleFileChange">
				<Button type="primary" @click="handleSave">
					Export
				</Button>
			</div>
		</section>

		<section class="v-image-crop-example__result">
			<div>
				<p>{{ status }}</p>
				<p>{{ positionText }}</p>
				<p>{{ fileText }}</p>
			</div>
			<img v-if="result" :src="result" alt="crop result">
		</section>
	</div>
</template>
<script setup>
import { computed, ref } from 'vue';
import { ImageCrop } from '..';
import { Button } from '../../button';
import { Slider } from '../../slider';

const createDemoImage = () => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
	<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
		<defs>
			<linearGradient id="sky" x1="0" y1="0" x2="1" y2="1">
				<stop offset="0" stop-color="#5c8df6"/>
				<stop offset="1" stop-color="#1f2633"/>
			</linearGradient>
		</defs>
		<rect width="1200" height="800" fill="url(#sky)"/>
		<circle cx="920" cy="170" r="86" fill="#ffd166"/>
		<path d="M0 560 C180 410 300 470 460 350 C650 210 820 420 1200 250 L1200 800 L0 800 Z" fill="#2d6a4f"/>
		<path d="M0 650 C220 520 380 620 560 500 C750 370 950 570 1200 430 L1200 800 L0 800 Z" fill="#52b788"/>
		<rect x="90" y="110" width="420" height="120" rx="16" fill="rgba(255,255,255,.78)"/>
		<text x="130" y="185" font-family="Arial, sans-serif" font-size="48" font-weight="700" fill="#1f2633">ImageCrop</text>
	</svg>
`);

const target = ref(null);
const src = ref(createDemoImage());
const scale = ref(1);
const rotate = ref(0);
const outputWidth = ref(750);
const outputHeight = ref(500);
const result = ref('');
const status = ref('Ready');
const positionText = ref('');
const fileText = ref('');
const outputSize = computed(() => [outputWidth.value, outputHeight.value]);

const handleFileChange = (event) => {
	const file = event.target.files?.[0];
	if (file) {
		src.value = file;
	}
	event.target.value = '';
};

const handleSave = async () => {
	const { dataURL, file } = await target.value.getImage({
		filename: 'image-crop',
		getFile: true
	});

	result.value = dataURL;
	fileText.value = file ? `${file.name} / ${Math.round(file.size / 1024)} KB` : '';
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

const handleImageChange = (type) => {
	status.value = `Changed: ${type}`;
};

const handlePositionChange = (position) => {
	positionText.value = `x ${position.x.toFixed(3)}, y ${position.y.toFixed(3)}`;
};
</script>
<style scoped>
.v-image-crop-example {
	display: grid;
	grid-template-columns: minmax(320px, 1fr) 360px;
	gap: 24px;
	padding: 24px;
	align-items: start;
}

.v-image-crop-example__stage {
	min-width: 0;
}

.v-image-crop-example__canvas {
	width: 100%;
	border: 1px solid #d9dde7;
}

.v-image-crop-example__controls {
	display: grid;
	gap: 18px;
}

.v-image-crop-example__controls label {
	display: grid;
	gap: 8px;
	font-size: 13px;
	color: #475467;
}

.v-image-crop-example__size {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 12px;
}

.v-image-crop-example__size input {
	width: 100%;
	height: 32px;
	padding: 0 8px;
	border: 1px solid #d9dde7;
	box-sizing: border-box;
}

.v-image-crop-example__actions {
	display: flex;
	gap: 12px;
	align-items: center;
}

.v-image-crop-example__result {
	grid-column: 1 / -1;
	display: grid;
	grid-template-columns: 360px minmax(0, 1fr);
	gap: 24px;
	align-items: start;
	font-size: 13px;
	color: #475467;
}

.v-image-crop-example__result p {
	margin: 0 0 8px;
}

.v-image-crop-example__result img {
	max-width: 360px;
	border: 1px solid #d9dde7;
}

@media (width <= 760px) {
	.v-image-crop-example {
		grid-template-columns: 1fr;
		padding: 16px;
	}

	.v-image-crop-example__result {
		grid-template-columns: 1fr;
	}
}
</style>
