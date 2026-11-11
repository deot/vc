<template>
	<div class="audit-stack">
		<div v-for="disabled in [false, true]" :key="String(disabled)" class="audit-sample" :data-state="disabled ? '禁用' : '普通 · 删除 · 本地选择'">
			<div class="audit-sample__label">{{ disabled ? '禁用' : '普通 · 删除 · 本地选择' }}</div>
			<component
				:is="mobile ? MUploadPicker : UploadPicker" v-model="values[`picker-${disabled}`]"
				:disabled="disabled" :picker="['image', 'video', 'audio', 'file']"
				:upload-options="uploadOptions"
			/>
		</div>
		<div v-for="state in ['上传中', '失败']" :key="state" class="audit-sample" :data-state="`真实项目组件 · ${state}`">
			<div class="audit-sample__label">真实项目组件 · {{ state }}</div>
			<component
				:is="mobile ? MUploadPicker : UploadPicker"
				:ref="el => stateRefs[state] = el"
				:picker="['image', 'file']"
				:upload-options="stateOptions[state]"
			/>
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
import { onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { UploadPicker, Button, MUploadPicker, FilePreview } from '@deot/vc';
import { svgImage } from '../sample';

const props = defineProps({ mobile: Boolean, overlayGeneration: Number });
const values = reactive({});
const audioUrl = ref('');
const videoUrl = ref('');
const imageUrl = svgImage();
const urls = new Set();
const leaves = new Set();
const fileMessage = ref('可选择本地音视频检查真实播放；未选择时展示内容区与播放控件。');
const handleClose = () => {
	leaves.forEach(leaf => leaf.destroy());
	leaves.clear();
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
	const source = { image: imageUrl, audio: audioUrl.value, video: videoUrl.value }[type];
	const leaf = FilePreview.open({
		data: [{ source, type, width: type === 'image' ? 320 : void 0, height: type === 'image' ? 180 : void 0 }],
		onClose: () => leaves.delete(leaf)
	});
	leaf?.destroy && leaves.add(leaf);
};
watch(() => props.overlayGeneration,
	handleClose);
onBeforeUnmount(() => { handleClose(); urls.forEach(url => URL.revokeObjectURL(url)); });
// 上传中、失败：真实上传一张图片和一个文件，请求一直挂起或直接失败
const stateRefs = {};
const pending = () => new Promise(() => {});
const stateOptions = {
	上传中: Object.fromEntries(['image', 'file'].map(type => [type, { onRequest: pending }])),
	失败: Object.fromEntries(['image', 'file'].map(type => [type, {
		onRequest: () => {
			throw new Error('模拟失败');
		}
	}]))
};
const stateFiles = () => [
	new File(['<svg xmlns="http://www.w3.org/2000/svg"/>'], '主题图片.svg', { type: 'image/svg+xml' }),
	new File(['Theme'], '说明.txt', { type: 'text/plain' })
];
onMounted(() => {
	Object.values(stateRefs).forEach((picker) => {
		// 各类型隐藏的 Upload 的选择框，顺序同 picker
		const inputs = picker?.$el?.querySelectorAll('.vc-upload-picker__uploader > input[type="file"]') || [];
		stateFiles().forEach((file, index) => {
			const input = inputs[index];
			if (!input) return;
			const transfer = new DataTransfer();
			transfer.items.add(file);
			input.files = transfer.files;
			input.dispatchEvent(new Event('change'));
		});
	});
});
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
