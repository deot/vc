<template>
	<div class="audit-stack">
		<div v-for="type in ['mix', 'group']" :key="type" class="audit-sample" :data-state="`${type} · 图片 / 视频 / 音频 / 文件 · hover`">
			<div class="audit-sample__label">{{ type }} · 图片 / 视频 / 音频 / 文件 · hover</div>
			<FilePreview :type="type" :previewable="false" :data="data" />
		</div>
		<div class="audit-sample" data-state="本地媒体">
			<div class="audit-sample__label">本地媒体</div>
			<div class="audit-stack">
				<input type="file" accept="audio/*,video/*" aria-label="选择本地媒体文件" @change="handleFile">
				<p class="audit-hint">{{ fileMessage }}</p>
				<div class="audit-row">
					<Button @click="handlePreview('image')">图片预览</Button>
					<Button @click="handlePreview('audio')">音频预览</Button>
					<Button @click="handlePreview('video')">视频预览</Button>
				</div>
			</div>
		</div>
	</div>
</template>
<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import PhotoSwipeLightbox from 'photoswipe/lightbox';
import { FilePreview, Button } from '@deot/vc';
import { AudioPreview } from '../../../../file-preview/preview/audio';
import { VideoPreview } from '../../../../file-preview/preview/video';
import { svgImage } from '../sample';

const props = defineProps({ mobile: Boolean, overlayGeneration: Number });
const audioUrl = ref('');
const videoUrl = ref('');
const imageUrl = svgImage();
const urls = new Set();
const leaves = new Set();
const lightboxes = new Set();
const fileMessage = ref('可选择本地音视频检查真实播放；未选择时展示内容区与播放控件。');
const handleClose = () => {
	leaves.forEach(leaf => leaf.destroy());
	leaves.clear();
	lightboxes.forEach(lightbox => lightbox.destroy());
	lightboxes.clear();
};
const handleFile = (event) => {
	const file = event.target.files?.[0];
	if (!file)
		return;
	const url = URL.createObjectURL(file);
	urls.add(url);
	if (file.type.startsWith('audio/'))
		audioUrl.value = url;
	else if (file.type.startsWith('video/'))
		videoUrl.value = url;
	fileMessage.value = `已选本地文件：${file.name}，不上传`;
};
const handlePreview = (type) => {
	if (type === 'image') {
		const lightbox = new PhotoSwipeLightbox({
			pswpModule: () => import('photoswipe'),
			dataSource: [{
				src: imageUrl,
				width: 320,
				height: 180
			}],
			closeTitle: '关闭',
			zoomTitle: '缩放'
		});
		lightboxes.add(lightbox);
		lightbox.on('destroy',
			() => { lightboxes.delete(lightbox); });
		lightbox.init();
		lightbox.loadAndOpen(0);
	} else if (type === 'audio' || type === 'video') {
		const leaf = (type === 'audio' ? AudioPreview : VideoPreview).popup({ src: type === 'audio' ? audioUrl.value : videoUrl.value });
		leaves.add(leaf);
		leaf.target.catch(() => { }).finally(() => { leaves.delete(leaf); });
	}
};
watch(() => props.overlayGeneration,
	handleClose);
onBeforeUnmount(() => { handleClose(); urls.forEach(url => URL.revokeObjectURL(url)); });
const data = computed(() => [
	{ source: imageUrl, type: 'image', name: 'theme.svg' },
	{ source: videoUrl.value || 'data:video/mp4;base64,', type: 'video', name: '本地视频.mp4' },
	{ source: audioUrl.value || 'data:audio/wav;base64,', type: 'audio', name: '本地音频.wav' },
	{ source: 'data:text/plain,Theme', type: 'file', name: '说明.txt' }
]);
</script>
