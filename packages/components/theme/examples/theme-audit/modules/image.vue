<template>
	<div class="audit-stack">
		<div class="audit-sample" data-state="加载成功">
			<div class="audit-sample__label">加载成功</div>
			<Image :src="imageUrl" :previewable="false" fit="contain" class="audit-image" />
		</div>
		<div class="audit-sample" data-state="无地址 / 加载失败">
			<div class="audit-sample__label">无地址 / 加载失败</div>
			<div class="audit-row">
				<Image src="" :previewable="false" class="audit-image is-empty" />
				<Image src="data:image/png;base64,invalid" :previewable="false" class="audit-image is-empty" />
			</div>
		</div>
		<Button @click="handlePreview">打开图片预览</Button>
	</div>
</template>
<script setup>
import { onBeforeUnmount, watch } from 'vue';
import { Image, Button, ImagePreview } from '@deot/vc';
import { svgImage } from '../sample';

const props = defineProps({ mobile: Boolean, overlayGeneration: Number });
const imageUrl = svgImage();
const leaves = new Set();
const handleClose = () => {
	leaves.forEach(leaf => leaf.destroy());
	leaves.clear();
};
const handlePreview = () => {
	const leaf = ImagePreview.open({
		data: [{ src: imageUrl, width: 320, height: 180 }],
		onClose: () => leaves.delete(leaf)
	});
	leaf && leaves.add(leaf);
};
watch(() => props.overlayGeneration,
	handleClose);
onBeforeUnmount(handleClose);
</script>
