<!-- 挂载方式（默认插槽 / to / 原位 / 满屏）与各属性、class / style 的效果，以及水印层被改动后的恢复 -->
<template>
	<div class="watermark-basic" :style="rootStyle">
		<div class="watermark-basic__controls">
			<Select
				v-for="item in CONTROLS"
				:key="item.key"
				v-model="controls[item.key]"
				:data="item.data"
				:label="item.label"
			/>
		</div>
		<div class="watermark-basic__actions">
			<Button @click="handleRemove">删除水印层</Button>
			<Button @click="handleHide">改 style 隐藏</Button>
			<Button @click="handleClass">加 class 隐藏</Button>
			<Button @click="handleOpen">打开弹层</Button>
		</div>

		<ul class="watermark-basic__notes">
			<li>挂载方式：默认插槽时铺满插槽内容；to 挂到目标容器；原位时留在所在位置、铺满父元素；满屏时固定铺满视口，默认挂到 body、层级 5000（盖住弹层）</li>
			<li>class / style 作用在水印层上，正文的颜色、字号不变；色块的 z-index 为 50，层级低于它时水印被色块盖住</li>
			<li>容器未定位时会被写入 position: relative，水印离开后还原；满屏不改写容器</li>
			<li>水印层被删除、被改样式或 class 后会重新生成</li>
			<li>默认颜色来自 --vc-watermark-color：它在祖先元素上变化，或切换右上角的主题后，水印自动重绘（满屏时水印在 body 下，不受这里的祖先影响）</li>
		</ul>

		<component :is="isSlot ? Watermark : 'div'" v-bind="isSlot ? binds : undefined">
			<div class="watermark-basic__content">
				<h3>标题</h3>
				<p>这是一段用于演示的正文内容，水印的颜色、字号只作用于水印层，不会改变这里的文字。</p>
				<div class="watermark-basic__block">z-index: 50</div>
				<p>这是一段用于演示的正文内容，水印的颜色、字号只作用于水印层，不会改变这里的文字。</p>
			</div>
		</component>

		<div class="watermark-basic__boxes">
			<div id="watermark-to-a" class="watermark-basic__box">容器 A</div>
			<div id="watermark-to-b" class="watermark-basic__box">容器 B</div>
			<div class="watermark-basic__box">
				原位
				<Watermark v-if="controls.mount === 'place'" v-bind="binds" />
			</div>
		</div>
		<Watermark
			v-if="to || isFullscreen"
			v-bind="binds"
			:to="to"
			:fullscreen="isFullscreen"
		/>

		<template v-if="isFullscreen">
			<p v-for="index in 40" :key="index">第 {{ index }} 段：这是一段用于撑开页面高度的正文内容，滚动时满屏水印不动。</p>
		</template>
	</div>
</template>
<script setup>
import { computed, reactive } from 'vue';
import { Watermark } from '..';
import { Select } from '../../select';
import { Button } from '../../button';
import { Modal } from '../../modal';

const toSVG = value => `data:image/svg+xml,${encodeURIComponent(value)}`;
const IMAGE = toSVG([
	'<svg xmlns="http://www.w3.org/2000/svg" width="120" height="48" viewBox="0 0 120 48">',
	'<g fill="#808080" fill-opacity=".4">',
	'<circle cx="24" cy="24" r="12"/><rect x="44" y="12" width="64" height="8" rx="4"/><rect x="44" y="28" width="40" height="8" rx="4"/>',
	'</g></svg>'
].join(''));

// 对照项：每项一个 Select
const toData = (values, labels = {}) => values.map(value => ({ value, label: labels[value] || value }));
const CONTROLS = [
	{
		key: 'mount',
		label: '挂载方式',
		data: toData(['slot', '#watermark-to-a', '#watermark-to-b', '#watermark-to-none', 'place', 'fullscreen'], {
			'slot': '默认插槽',
			'#watermark-to-a': 'to：容器 A',
			'#watermark-to-b': 'to：容器 B',
			'#watermark-to-none': 'to：不存在的选择器（不渲染）',
			'place': '原位（铺满父元素）',
			'fullscreen': 'fullscreen（满屏）'
		})
	},
	{
		key: 'content',
		label: '内容',
		data: toData(['text', 'lines', 'image', 'error'], {
			text: '单行文字',
			lines: '多行文字',
			image: '图片',
			error: '图片加载失败（回退文字）'
		})
	},
	{ key: 'rotate', label: 'rotate', data: toData(['-20', '0', '30', '90'], { '-20': '-20（默认）' }) },
	{ key: 'gap', label: 'gap', data: toData(['100', '40', '160,40'], { '100': '100（默认）', '160,40': '[160, 40]' }) },
	{
		key: 'offset',
		label: 'offset',
		data: toData(['none', '0', '20,80'], { 'none': '不传（gap 的一半）', '0': '0（贴左上角）', '20,80': '[20, 80]' })
	},
	{
		key: 'size',
		label: 'width / height',
		data: toData(['none', '40', '200,60'], { 'none': '不传', '40': 'width 40（文字被压缩）', '200,60': 'width 200 · height 60' })
	},
	{
		key: 'zIndex',
		label: 'zIndex',
		data: toData(['none', '1', '60'], { none: '不传（1，满屏时 5000）', 1: '1（满屏时在弹层之下）', 60: '60（盖住色块）' })
	},
	{ key: 'fontSize', label: 'style: font-size', data: toData(['none', '12', '24'], { none: '不传（14px）', 12: '12px', 24: '24px' }) },
	{
		key: 'color',
		label: 'style: color',
		data: toData(['none', 'rgb(245 34 45 / 30%)', 'var(--vc-color-primary)'], {
			'none': '不传（中性灰）',
			'rgb(245 34 45 / 30%)': '红 30%',
			'var(--vc-color-primary)': '主题色'
		})
	},
	{ key: 'fontWeight', label: 'class: 字重', data: toData(['normal', 'bold'], { normal: '不加 class', bold: '加 class（bold）' }) },
	{
		key: 'ancestor',
		label: '祖先上的 --vc-watermark-color',
		data: toData(['none', 'rgb(245 34 45 / 30%)', 'rgb(29 184 140 / 40%)'], {
			'none': '不设置',
			'rgb(245 34 45 / 30%)': '红 30%',
			'rgb(29 184 140 / 40%)': '绿 40%'
		})
	}
];
const controls = reactive(Object.fromEntries(CONTROLS.map(({ key, data }) => [key, data[0].value])));

const isSlot = computed(() => controls.mount === 'slot');
const isFullscreen = computed(() => controls.mount === 'fullscreen');
const to = computed(() => (controls.mount[0] === '#' ? controls.mount : undefined));
const rootStyle = computed(() => (controls.ancestor === 'none' ? undefined : { '--vc-watermark-color': controls.ancestor }));

const toNumbers = value => value.split(',').map(Number);
const binds = computed(() => {
	const { content, rotate, gap, offset, size, zIndex, fontSize, color, fontWeight } = controls;
	const [width, height] = size === 'none' ? [] : toNumbers(size);
	return {
		value: content === 'lines' ? ['内部资料', '请勿外传'] : '内部资料',
		src: content === 'image' ? IMAGE : content === 'error' ? 'data:image/png;base64,AAAA' : undefined,
		rotate: Number(rotate),
		gap: toNumbers(gap),
		offset: offset === 'none' ? undefined : toNumbers(offset),
		width,
		height,
		zIndex: zIndex === 'none' ? undefined : Number(zIndex),
		class: { 'is-bold': fontWeight === 'bold' },
		style: {
			fontSize: fontSize === 'none' ? undefined : `${fontSize}px`,
			color: color === 'none' ? undefined : color
		}
	};
});

const getLayers = () => Array.from(document.querySelectorAll('.vc-watermark__layer'));
const handleRemove = () => getLayers().forEach(el => el.remove());
const handleHide = () => getLayers().forEach(el => (el.style.display = 'none'));
const handleClass = () => getLayers().forEach(el => el.classList.add('is-hidden'));
const handleOpen = () => Modal.info({
	title: '弹层',
	content: '满屏水印默认在弹层之上；zIndex 为 1 时在弹层之下。'
});
</script>

<style lang="scss">
.watermark-basic {
	padding: 20px;
	font-size: 14px;
	line-height: 22px;

	&__controls,
	&__actions,
	&__boxes {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
	}

	&__controls {
		// 右上角留给主题与性能读数的按钮
		padding-right: 220px;

		.vc-select {
			width: 280px;
		}
	}

	&__actions,
	&__boxes {
		margin-top: 12px;
	}

	&__notes {
		padding-left: 20px;
		margin: 12px 0;
		list-style: disc;
	}

	&__content {
		padding: 20px;
		border: 1px solid var(--vc-color-light-deeper);
	}

	&__block {
		position: relative;
		z-index: 50;
		width: 320px;
		height: 120px;
		margin: 12px 0;
		line-height: 120px;
		color: #fff;
		text-align: center;
		background: #456cf6;
	}

	&__box {
		width: 320px;
		height: 160px;
		padding: 12px;
		border: 1px solid var(--vc-color-light-deeper);
	}
}

// 满屏时水印层在 body 下，不在 .watermark-basic 内
.vc-watermark__layer.is-bold {
	font-weight: bold;
}

.vc-watermark__layer.is-hidden {
	display: none;
}
</style>
