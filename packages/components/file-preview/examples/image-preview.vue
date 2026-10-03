<template>
	<div style="padding: 20px; background: var(--vc-background-color-lightest);">
		<p>ImagePreview.open：直接打开图片预览（不经过 FilePreview 的 enhancer）</p>
		<button @click="handleClick(0)">从第 1 张打开</button>
		<button @click="handleClick(2)">从第 3 张打开</button>
	</div>
</template>
<script setup>
import { ImagePreview } from '..';

const dataSource = [
	'https://dummyimage.com/1800x600/555/fff.png?text=1',
	'https://dummyimage.com/600x1800/555/fff.png?text=2',
	'https://dummyimage.com/3000x1500/555/fff.png?text=3',
	'https://dummyimage.com/1500x3000/555/fff.png?text=4',
	'https://dummyimage.com/800x600/555/fff.png?text=5'
];

const handleClick = (current) => {
	ImagePreview.open({
		current,
		data: dataSource
	});
};
</script>
