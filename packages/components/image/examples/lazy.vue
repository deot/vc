<template>
	<div class="v-image-lazy">
		<p>滚动各容器，图片进入可视区时才加载；括号内为已加载数量</p>
		<div class="_row">
			<div v-for="(item, index) in containers" :key="item.label" class="_col">
				<h3>{{ item.label }}（{{ loaded[index] }} / {{ urls.length }}）</h3>
				<Scroller v-if="item.scroller" :wheel="item.wheel" height="300px" class="_box">
					<Image
						v-for="url in urls"
						:key="url"
						:src="url"
						lazy
						class="_image"
						@load="loaded[index]++"
					/>
				</Scroller>
				<div v-else class="_box _native">
					<Image
						v-for="url in urls"
						:key="url"
						:src="url"
						lazy
						class="_image"
						@load="loaded[index]++"
					/>
				</div>
			</div>
		</div>
	</div>
</template>
<script setup>
import { reactive } from 'vue';
import { Image } from '..';
import { Scroller } from '../../scroller';

const containers = [
	{ label: '原生滚动' },
	{ label: 'Scroller', scroller: true },
	{ label: 'Scroller（wheel）', scroller: true, wheel: true }
];

const toSvg = text => `data:image/svg+xml,${encodeURIComponent([
	'<svg xmlns="http://www.w3.org/2000/svg" width="200" height="120">',
	'<rect width="200" height="120" fill="#c0c4cc"/>',
	`<text x="100" y="66" font-size="16" text-anchor="middle" fill="#fff">${text}</text>`,
	'</svg>'
].join(''))}`;
const urls = Array.from({ length: 12 }, (_, index) => toSvg(`图片 ${index + 1}`));
const loaded = reactive([0, 0, 0]);
</script>
<style>
.v-image-lazy { padding: 20px; }

.v-image-lazy ._row {
	display: flex;
	gap: 16px;
}

.v-image-lazy ._col { width: 220px; }

.v-image-lazy ._box { background: var(--vc-color-light-deeper); }

.v-image-lazy ._native {
	height: 300px;
	overflow: auto;
}

.v-image-lazy ._image {
	display: block;
	width: 200px;
	height: 120px;
	margin: 0 auto 8px;
}
</style>
