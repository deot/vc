<template>
	<div style="padding: 20px; background: var(--vc-background-color-light);">
		<p>type="mix"（默认）：按 data 顺序混编，图片显示缩略图，其余只显示名称</p>
		<div class="toolbar">
			<label><input v-model="vertical" type="checkbox"> vertical</label>
			<label><input v-model="previewable" type="checkbox"> previewable</label>
			<button v-for="item in sizes" :key="item" :class="{ 'is-active': size === item }" @click="size = item">
				{{ item }}
			</button>
		</div>
		<FilePreview
			:data="dataSource"
			:size="size"
			:vertical="vertical"
			:previewable="previewable"
		/>

		<p>字符串按逗号分隔</p>
		<FilePreview :data="stringSource" />
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { FilePreview } from '..';

const sizes = ['mini', 'small', 'medium', 'large'];
const size = ref('medium');
const vertical = ref(false);
const previewable = ref(true);

const dataSource = ref([
	{ source: 'https://dummyimage.com/1800x600/555/fff.png?text=banner', name: 'banner.png' },
	{ source: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', name: '示例文件-2026.pdf' },
	{
		source: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
		thumbnail: 'https://dummyimage.com/120x120/2d8cf0/fff.png?text=cover'
	},
	{ source: 'https://dummyimage.com/600x1800/555/fff.png?text=detail', type: 'image', name: 'detail-01.jpg' },
	'https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3',
	{ source: 'https://dummyimage.com/3000x1500/555/fff.png?text=detail-02', name: 'detail-02.png' },
	{ source: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4', name: 'flower-2.mp4' },
	{ source: 'https://samplefile.com/samples/download/document/xlsx/xlsx_formula_recalc_sample.xlsx/', type: 'file', name: '示例文件.xlsx' }
]);

const stringSource = 'https://dummyimage.com/800x600/555/fff.png?text=a,https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
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
