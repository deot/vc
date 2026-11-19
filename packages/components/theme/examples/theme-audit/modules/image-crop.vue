<template>
	<div class="audit-stack">
		<div class="audit-stack audit-image-crop__workspace">
			<ImageCrop ref="crop" v-model:zoom="zoom" v-model:rotate="rotate" :src="src" :aspect-ratio="16 / 9" class="audit-image-crop" />
			<label>缩放<Slider v-model="zoom" :min="1" :max="4" :step="0.1" /></label>
			<label>旋转<Slider v-model="rotate" :min="0" :max="360" /></label>
			<Button @click="handleExport">预览裁剪结果</Button>
			<img v-if="result" :src="result" alt="裁剪结果" class="audit-result-image">
		</div>
		<p class="audit-hint">棋盘底、遮罩与裁剪框为固定配色（可用 --vc-image-crop-* 覆盖）；周围控件跟随主题，不上传文件。</p>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { ImageCrop, Button, Slider } from '@deot/vc';
import { svgImage } from '../sample';

const crop = ref();
const zoom = ref(1);
const rotate = ref(0);
const result = ref('');
const src = svgImage('Crop');
const handleExport = async () => { result.value = (await crop.value.getImage({ width: 240 })).dataURL; };
</script>
