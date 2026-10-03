<template>
	<div style="padding: 20px; background: var(--vc-background-color-lightest);">
		<p>default 插槽：{ row, index, preview }；使用插槽后外层不再自动预览，由 preview() 触发（同样会先经过全局 enhancer）</p>
		<FilePreview :data="dataSource" vertical>
			<template #default="{ row, index, preview }">
				<div class="row">
					<span class="index">{{ index + 1 }}</span>
					<span class="type">{{ row.type }}</span>
					<span class="name">{{ row.name }}</span>
					<a @click="preview">预览</a>
					<a :href="row.source" target="_blank" rel="noopener">新窗口打开</a>
				</div>
			</template>
		</FilePreview>
	</div>
</template>
<script setup>
import { FilePreview } from '..';

const dataSource = [
	{ source: 'https://dummyimage.com/1800x600/555/fff.png?text=1', name: '1.png' },
	'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
	'https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3',
	{ source: 'https://dummyimage.com/600x1800/555/fff.png?text=2', name: '2.png' },
	{ source: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', name: '示例文件-2026.pdf' }
];
</script>
<style scoped>
.row {
	display: flex;
	align-items: center;
	gap: 12px;
	font-size: 13px;
}

.index {
	width: 16px;
	color: #909399;
}

.type {
	width: 40px;
	color: #909399;
}

.name {
	width: 160px;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.row a {
	color: #456cf6;
	cursor: pointer;
}
</style>
