<template>
	<div class="image-crop-demo">
		<section class="image-crop-demo__stage">
			<ImageCrop
				ref="target"
				v-model:zoom="zoom"
				v-model:rotate="rotate"
				:src="src"
				:aspect-ratio="aspectRatio"
				:shape="shape"
				:resizable="resizable"
				:disabled="disabled"
				@load="handleLoad"
				@error="handleError"
				@change="handleChange"
			/>
			<p class="image-crop-demo__text">
				拖动平移，滚轮缩放（以指针为中心），聚焦后方向键平移、+ / - 缩放；resizable 时拖边角调整裁剪框
			</p>
		</section>

		<section class="image-crop-demo__controls">
			<label>
				<span>比例</span>
				<Select v-model="ratioKey" :data="ratios" />
			</label>
			<label>
				<span>形状</span>
				<RadioGroup v-model="shape" type="button">
					<Radio value="square">square</Radio>
					<Radio value="circle">circle</Radio>
				</RadioGroup>
			</label>
			<div class="image-crop-demo__switches">
				<label><Switch v-model="resizable" /> resizable</label>
				<label><Switch v-model="disabled" /> disabled</label>
			</div>
			<label>
				<span>缩放 {{ zoom.toFixed(2) }}</span>
				<Slider v-model="zoom" :min="1" :max="4" :step="0.01" />
			</label>
			<label>
				<span>旋转 {{ rotate }}°</span>
				<Slider v-model="rotate" :min="-180" :max="180" />
			</label>
			<div class="image-crop-demo__actions">
				<Button icon="rotate-left" @click="rotate -= 90" />
				<Button icon="rotate-right" @click="rotate += 90" />
				<Button @click="target.reset()">还原</Button>
				<Button type="primary" @click="handleExport">导出</Button>
			</div>
			<div class="image-crop-demo__actions">
				<input type="file" accept="image/*" @change="handleFileChange">
			</div>
			<div class="image-crop-demo__actions">
				<Button @click="handleOpen">ImageCrop.open</Button>
				<Button @click="handleRestore">setData（恢复上次）</Button>
			</div>
		</section>

		<section class="image-crop-demo__result">
			<p>{{ status }}</p>
			<p v-if="data">data: {{ dataText }}</p>
			<p v-if="fileText">{{ fileText }}</p>
			<img v-if="result" :src="result" alt="裁剪结果" :class="{ 'is-circle': shape === 'circle' }">
		</section>
	</div>
</template>
<script setup>
import { computed, ref } from 'vue';
import { ImageCrop } from '..';
import { Button } from '../../button';
import { Radio, RadioGroup } from '../../radio';
import { Select } from '../../select';
import { Slider } from '../../slider';
import { Switch } from '../../switch';

const src = ref('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
	<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
		<rect width="1200" height="800" fill="#5c8df6"/>
		<circle cx="920" cy="170" r="86" fill="#ffd166"/>
		<path d="M0 560 C180 410 300 470 460 350 C650 210 820 420 1200 250 L1200 800 L0 800 Z" fill="#2d6a4f"/>
		<path d="M0 650 C220 520 380 620 560 500 C750 370 950 570 1200 430 L1200 800 L0 800 Z" fill="#52b788"/>
		<rect x="90" y="110" width="420" height="120" rx="16" fill="rgba(255,255,255,.78)"/>
		<text x="130" y="185" font-family="Arial, sans-serif" font-size="48" font-weight="700" fill="#1f2633">Sample</text>
	</svg>
`));

const ratios = [
	{ label: '1 : 1', value: '1' },
	{ label: '4 : 3', value: '4/3' },
	{ label: '16 : 9', value: '16/9' },
	{ label: '3 : 4', value: '3/4' },
	{ label: '不限（null）', value: 'free' }
];

const target = ref(null);
const ratioKey = ref('1');
const shape = ref('square');
const resizable = ref(false);
const disabled = ref(false);
const zoom = ref(1);
const rotate = ref(0);
const data = ref(null);
const saved = ref(null);
const result = ref('');
const status = ref('加载中');
const fileText = ref('');

const dataText = computed(() => {
	const { x, y, width, height, rotate: angle } = data.value;
	return `x ${x.toFixed(1)}, y ${y.toFixed(1)}, ${width.toFixed(1)} × ${height.toFixed(1)}, ${angle}°`;
});

const aspectRatio = computed(() => {
	if (ratioKey.value === 'free') return null;
	const [a, b = 1] = ratioKey.value.split('/').map(Number);
	return a / b;
});

const handleLoad = (image) => {
	status.value = `已加载 ${image.naturalWidth} × ${image.naturalHeight}`;
};

const handleError = () => {
	status.value = '图片加载失败';
};

const handleChange = (value) => {
	data.value = value;
};

const handleFileChange = (event) => {
	const file = event.target.files?.[0];
	file && (src.value = file);
	event.target.value = '';
};

const handleExport = async () => {
	const { dataURL, file } = await target.value.getImage({
		width: 480,
		type: 'image/jpeg',
		quality: 0.9,
		fillColor: '#fff',
		filename: 'crop.jpg'
	});
	result.value = dataURL;
	saved.value = target.value.getData();
	fileText.value = `${file.name} / ${Math.round(file.size / 1024)} KB`;
};

const handleRestore = () => {
	saved.value && target.value.setData(saved.value);
};

const handleOpen = async () => {
	try {
		const { dataURL, data: value } = await ImageCrop.open({
			src: src.value,
			aspectRatio: aspectRatio.value,
			shape: shape.value,
			resizable: resizable.value,
			width: 480
		});
		result.value = dataURL;
		status.value = `open 完成：${value.width.toFixed(0)} × ${value.height.toFixed(0)}`;
	} catch {
		status.value = 'open 已取消';
	}
};
</script>
<style scoped>
.image-crop-demo {
	display: grid;
	grid-template-columns: minmax(320px, 1fr) 320px;
	gap: 24px;
	align-items: start;
	padding: 24px;
}

.image-crop-demo__stage {
	min-width: 0;
}

.image-crop-demo__text {
	margin: 8px 0 0;
	font-size: 12px;
	color: #86909c;
}

.image-crop-demo__controls {
	display: grid;
	gap: 16px;
}

.image-crop-demo__controls > label {
	display: grid;
	gap: 8px;
	font-size: 13px;
}

.image-crop-demo__switches,
.image-crop-demo__actions {
	display: flex;
	flex-wrap: wrap;
	gap: 12px;
	align-items: center;
	font-size: 13px;
}

.image-crop-demo__result {
	grid-column: 1 / -1;
	font-size: 13px;
}

.image-crop-demo__result p {
	margin: 0 0 8px;
}

.image-crop-demo__result img {
	max-width: 240px;
	border: 1px solid #e5e6eb;
}

.image-crop-demo__result img.is-circle {
	border-radius: 50%;
}

@media (width <= 760px) {
	.image-crop-demo {
		grid-template-columns: 1fr;
		padding: 16px;
	}
}
</style>
