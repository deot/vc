<template>
	<div class="view-demo">
		<p class="view-demo__tip">
			点击内容中的图片：previewable 开启时打开预览，预览列表为内容内的全部图片，
			相同地址的图片也会定位到被点击的那张；关闭时点击不响应。
		</p>
		<div class="view-demo__controls">
			<Select
				v-for="item in CONTROLS"
				:key="item.key"
				v-model="controls[item.key]"
				:data="item.data"
				:label="item.label"
			/>
		</div>
		<EditorView :value="value" :previewable="controls.previewable === 'on'" />
	</div>
</template>
<script setup>
import { reactive } from 'vue';
import { Select } from '../../select';
import { EditorView } from '../index';

// 对照项：每项一个 Select
const CONTROLS = [
	{ key: 'previewable', label: 'previewable', data: [{ value: 'on', label: '开启' }, { value: 'off', label: '关闭' }] }
];
const controls = reactive(Object.fromEntries(CONTROLS.map(({ key, data }) => [key, data[0].value])));

const createImage = (color, text) => {
	const svg = [
		'<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200">',
		`<rect width="300" height="200" fill="${color}"/>`,
		`<text x="150" y="108" font-size="24" fill="#fff" text-anchor="middle">${text}</text>`,
		'</svg>'
	].join('');
	return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};
const imageA = createImage('#5b8ff9', '图片 A');
const imageB = createImage('#5ad8a6', '图片 B');

// 第 1、3 张地址相同
const value = [
	'<p>第一段说明文本</p>',
	`<p><img src="${imageA}"></p>`,
	'<p>第二段说明文本</p>',
	`<p><img src="${imageB}"> <img src="${imageA}"></p>`
].join('');
</script>

<style lang="scss">
.view-demo {
	padding: 40px;

	&__tip {
		color: #666;
	}

	&__controls {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
		margin-bottom: 24px;

		.vc-select {
			width: 240px;
		}
	}

	img {
		max-width: 300px;
	}
}
</style>
