<template>
	<div class="audit-stack">
		<div v-for="disabled in [false, true]" :key="String(disabled)" class="audit-sample" :data-state="disabled ? '禁用' : '普通 · 删除 · 本地选择'">
			<div class="audit-sample__label">{{ disabled ? '禁用' : '普通 · 删除 · 本地选择' }}</div>
			<component
				:is="mobile ? MUploadPicker : UploadPicker" v-model="values[`picker-${disabled}`]"
				:disabled="disabled" :picker="['image', 'video', 'audio', 'file']"
				:upload-options="uploadOptions" @click.capture="handlePickerPreview"
			/>
		</div>
		<div v-for="state in ['上传中', '失败']" :key="state" class="audit-sample" :data-state="`真实项目组件 · ${state}`">
			<div class="audit-sample__label">真实项目组件 · {{ state }}</div>
			<div :class="mobile ? 'vcm-upload-picker' : 'vc-upload-picker'">
				<div class="audit-row">
					<component
						:is="component" v-for="(component, index) in itemComponents" :key="index"
						:row="{ value: null, percent: state === '上传中' ? 48 : 0, errorFlag: state === '失败', label: `${state}-${index}` }"
						:index="index" :data="[]" :key-value="{ value: 'value', label: 'label' }" disabled
					/>
				</div>
			</div>
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
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue';
import PhotoSwipeLightbox from 'photoswipe/lightbox';
import { UploadPicker, Button, MUploadPicker } from '@deot/vc';
import { AudioPreview } from '../../../../file-preview/preview/audio';
import { VideoPreview } from '../../../../file-preview/preview/video';
import { ImageItem } from '../../../../upload-picker/item/image';
import { VideoItem } from '../../../../upload-picker/item/video';
import { AudioItem } from '../../../../upload-picker/item/audio';
import { FileItem } from '../../../../upload-picker/item/file';
import { MImageItem } from '../../../../upload-picker/mobile/item/image';
import { MVideoItem } from '../../../../upload-picker/mobile/item/video';
import { MAudioItem } from '../../../../upload-picker/mobile/item/audio';
import { MFileItem } from '../../../../upload-picker/mobile/item/file';
import { svgImage } from '../sample';

const props = defineProps({ mobile: Boolean, overlayGeneration: Number });
const values = reactive({});
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
	const type = file.type.startsWith('audio/') ? 'audio' : 'video';
	for (const key of ['picker-false', 'picker-true']) {
		if (values[key])
			values[key] = values[key].map(item => item.type === type
				? {
						...item,
						value: url
					}
				: item);
	}
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
const handlePickerPreview = (event) => {
	const target = event.target;
	if (target.closest('.vc-upload-picker__delete, .vcm-upload-picker__delete'))
		return;
	const item = target.closest('[class*="-image-item"], [class*="-video-item"], [class*="-audio-item"], [class*="-file-item"]');
	if (!item)
		return;
	event.stopPropagation();
	event.preventDefault();
	const type = ['image', 'video', 'audio', 'file'].find(value => item.className.includes(`-${value}-item`));
	if (type)
		handlePreview(type);
};
watch(() => props.overlayGeneration,
	handleClose);
onBeforeUnmount(() => { handleClose(); urls.forEach(url => URL.revokeObjectURL(url)); });
const itemComponents = computed(() => props.mobile
	? [MImageItem, MVideoItem, MAudioItem, MFileItem]
	: [ImageItem, VideoItem, AudioItem, FileItem]);
for (const disabled of [false, true]) {
	values[`picker-${disabled}`] = [
		{ value: imageUrl, label: '主题图片.svg', type: 'image' },
		{ value: videoUrl.value, label: '本地视频.mp4', type: 'video' },
		{ value: audioUrl.value, label: '本地音频.wav', type: 'audio' },
		{ value: 'data:text/plain,Theme', label: '说明.txt', type: 'file' }
	];
}
const uploadOptions = Object.fromEntries(['image', 'video', 'audio', 'file'].map(type => [type, {
	onRequest: ({ requestOptions }) => ({ ...requestOptions, url: undefined }),
	onResponse: ({ requestOptions }) => {
		const url = URL.createObjectURL(requestOptions.file);
		urls.add(url);
		return { value: url, label: requestOptions.file.name, type };
	}
}]));
</script>
