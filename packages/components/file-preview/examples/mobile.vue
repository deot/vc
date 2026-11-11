<template>
	<div class="demo">
		<p>不传 type 时自动选择，此处数据既有图片、视频又有文件，为 group；点开为移动端查看器（只保留关闭按钮；双击或捏合缩放、左右滑切换、下滑关闭）</p>
		<MRadioGroup v-model="size" type="button" size="small">
			<MRadio v-for="item in sizes" :key="item" :value="item">
				{{ item }}
			</MRadio>
		</MRadioGroup>
		<MFilePreview :data="dataSource" :size="size" />

		<p>type="list"：都为整行</p>
		<MFilePreview :data="dataSource" :size="size" type="list" />

		<p>type="grid"：都为方格</p>
		<MFilePreview :data="dataSource" :size="size" type="grid" />

		<p>直接打开</p>
		<div class="actions">
			<MButton @click="openImages">
				MImagePreview.open
			</MButton>
			<MButton @click="openFiles">
				MFilePreview.open（文件）
			</MButton>
		</div>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { MFilePreview, MImagePreview } from '../index.m';
import { MButton } from '../../button/index.m';
import { MRadio, MRadioGroup } from '../../radio/index.m';

const sizes = ['mini', 'small', 'medium', 'large'];
const size = ref('medium');

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
	{ source: 'https://www.w3.org/', type: 'file', name: '无扩展名文件' }
]);

const openImages = () => {
	MImagePreview.open({
		data: [
			'https://dummyimage.com/1800x600/555/fff.png?text=1',
			'https://dummyimage.com/600x1800/555/fff.png?text=2',
			'https://dummyimage.com/3000x1500/555/fff.png?text=3'
		]
	});
};

const openFiles = () => {
	MFilePreview.open({
		data: [
			{ source: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', name: '示例文件-2026.pdf' },
			{ source: 'https://www.w3.org/', type: 'file', name: '无扩展名文件' }
		]
	});
};
</script>
<style scoped>
.demo {
	display: flex;
	flex-direction: column;
	gap: 12px;
	padding: 16px;
	background: var(--vc-background-color-lightest);
}

.demo p {
	margin: 0;
	font-size: 13px;
	color: var(--vc-color-dark-light);
}

.actions {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
}
</style>
