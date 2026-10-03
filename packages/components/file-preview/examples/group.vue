<template>
	<div style="padding: 20px; background: var(--vc-background-color-lightest);">
		<p>type="group"：按 image → video → audio → file 分组；预览顺序仍按 data 原始顺序</p>
		<div class="toolbar">
			<label><input v-model="vertical" type="checkbox"> vertical</label>
			<button v-for="item in sizes" :key="item" :class="{ 'is-active': size === item }" @click="size = item">
				{{ item }}
			</button>
		</div>
		<FilePreview
			:data="dataSource"
			:size="size"
			:vertical="vertical"
			type="group"
		/>

		<p>图片：有 thumbnail 时展示缩略图，预览使用 source</p>
		<FilePreview :data="thumbnails" type="group" />

		<p>视频：无 thumbnail 时展示首帧</p>
		<FilePreview :data="videos" type="group" />
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { FilePreview } from '..';

const sizes = ['mini', 'small', 'medium', 'large'];
const size = ref('medium');
const vertical = ref(false);

const dataSource = ref([
	{ source: 'https://dummyimage.com/1800x600/555/fff.png?text=1', name: '1.png' },
	{ source: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', name: '示例文件-2026.pdf' },
	{
		source: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
		thumbnail: 'https://dummyimage.com/120x120/2d8cf0/fff.png?text=cover'
	},
	{ source: 'https://dummyimage.com/600x1800/555/fff.png?text=2', name: '2.png' },
	'https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3',
	{ source: 'https://dummyimage.com/3000x1500/555/fff.png?text=3', name: '3.png' },
	{ source: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4', name: 'flower-2.mp4' },
	{ source: 'https://samplefile.com/samples/download/document/xlsx/xlsx_formula_recalc_sample.xlsx/', type: 'file', name: '示例文件.xlsx' },
	{ source: 'https://www.w3.org/', type: 'file', name: '无扩展名文件' }
]);

const thumbnails = [
	{ source: 'https://dummyimage.com/1800x600/555/fff.png?text=source-1', thumbnail: 'https://dummyimage.com/96x96/2d8cf0/fff.png?text=thumb-1' },
	{ source: 'https://dummyimage.com/600x1800/555/fff.png?text=source-2', thumbnail: 'https://dummyimage.com/96x96/1db88c/fff.png?text=thumb-2' }
];

const videos = [
	'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4'
];
</script>
<style scoped>
.toolbar {
	display: flex;
	align-items: center;
	gap: 12px;
	margin-bottom: 12px;
}

.toolbar .is-active {
	color: #456cf6;
}
</style>
