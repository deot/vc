<template>
	<div>
		<span @click="handleClick">自定义预览</span>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { ImagePreview } from '..';

const dataSource = ref([
	'https://dummyimage.com/1800x600/555/fff/?text=1',
	'https://dummyimage.com/600x1800/555/fff/?text=2',
	'https://dummyimage.com/3000x1500/555/fff/?text=3',
	'https://dummyimage.com/1500x3000/555/fff/?text=4',
	'https://dummyimage.com/800x600/555/fff/?text=5'
]);

const handleClick = (e) => {
	// let pos = {};
	// try {
	// 	const target = e.target; // 先得到pos, 否则getThumbBoundsFn再计划，target已变化（比如弹窗transition的影响）
	// 	const pageYScroll = window.pageYOffset || document.documentElement.scrollTop;
	// 	const rect = target.getBoundingClientRect();

	// 	pos = { x: rect.left, y: rect.top + pageYScroll, w: rect.width };

	// 	console.log(pos);
	// } catch (error) {
	// 	console.log(error);
	// }
	ImagePreview.open({
		data: dataSource.value,
	});
};
</script>
