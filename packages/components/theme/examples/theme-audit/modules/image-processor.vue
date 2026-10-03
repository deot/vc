<template>
	<div class="audit-stack">
		<div class="audit-row">
			<div><p>原图</p><img :src="src" width="160" height="90" alt="原图"></div>
			<div><p>置灰</p><ImageProcessor :src="src" :output-size="[160, 90]" enhancer="gray" /></div>
			<div>
				<p>抠图</p>
				<ImageProcessor :src="src" :output-size="[160, 90]" enhancer="cutout" :options="{ targetColor: [255, 255, 255, 1], tolerance: 16 }" />
			</div>
		</div>
		<p class="audit-hint">处理颜色属于图片配置；对照当前主题表面检查图片显示。</p>
	</div>
</template>
<script setup>
import { ImageProcessor } from '@deot/vc';
import { svgImage } from '../sample';

const src = svgImage('Process');
</script>
