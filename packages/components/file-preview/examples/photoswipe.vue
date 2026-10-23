<template>
	<div class="page">
		<p>与 PhotoSwipe 首页相同的五图网格：左图跨两行，右侧四张方图，间距 10px。缩略图按封面裁切，预览使用原图尺寸。</p>
		<div class="stage">
			<FilePreview :data="photos">
				<template #default="{ row, preview }">
					<div class="frame" @click="preview">
						<img :src="row.thumbnail" :alt="row.name">
					</div>
				</template>
			</FilePreview>
		</div>
	</div>
</template>
<script setup>
import { FilePreview } from '..';

const CDN = 'https://cdn.photoswipe.com/photoswipe-demo-images/photos/home-demo';

const photo = (folder, width, height, thumb) => ({
	source: `${CDN}/${folder}/${folder}_c_scale,w_2500.jpg`,
	thumbnail: `${CDN}/${folder}/${folder}_c_scale,w_${thumb}.jpg`,
	width,
	height,
	name: `${folder}.jpg`
});

const photos = [
	photo('luca-bravo-ny6qxqv_m04-unsplash_snrzpf', 2500, 3125, 664),
	photo('luca-bravo-O453M2Liufs-unsplash_qqt53u', 2500, 1667, 300),
	photo('luca-bravo-VowIFDxogG4-unsplash_ibrktu', 2500, 1667, 300),
	photo('luca-bravo-zAjdgNXsMeg-unsplash_q6zdih', 2500, 1667, 300),
	photo('luca-bravo-A-fubu9QJxE-unsplash_jxy5p8', 2500, 1667, 300)
];
</script>
<style scoped>
.page {
	padding: 20px;
	background: var(--vc-background-color-lightest);
}

/* 容器 1140，左右各 16，和 PhotoSwipe 首页内容区一致 */
.stage {
	box-sizing: border-box;
	max-width: 1140px;
	padding: 0 16px;
}

.stage :deep(.vc-file-preview) {
	display: grid;
	width: 100%;
	grid-gap: 10px;
	grid-template-columns: 1fr 0.5fr 0.5fr;
}

.stage :deep(.vc-file-preview__item:first-child) {
	grid-row: span 2;
}

.stage :deep(.vc-file-preview__item) {
	position: relative;
}

.stage :deep(.vc-file-preview__item:not(:first-child)) {
	aspect-ratio: 1;
}

.frame {
	position: absolute;
	overflow: hidden;
	cursor: pointer;
	inset: 0;
}

.frame img {
	position: absolute;
	width: 100%;
	height: 100%;
	object-fit: cover;
	inset: 0;
}

@media (max-width: 650px) {
	.stage :deep(.vc-file-preview) {
		grid-gap: 5px;
	}
}
</style>
