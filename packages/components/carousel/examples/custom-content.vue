<template>
	<div class="v-carousel-custom-content">
		<h3>CarouselItem：label</h3>
		<p class="v-carousel-custom-content__tip">指示器上的文字来自 CarouselItem 的 label，支持字符串、渲染函数与 { type, value }；字符串按文本渲染。</p>
		<div class="v-carousel-custom-content__controls">
			<Select v-model="kind" :data="KINDS" label="内容" />
		</div>
		<div :key="kind" class="v-carousel-custom-content__stage">
			<Carousel :height="160" :autoplay="false">
				<CarouselItem :label="value">
					<div class="v-carousel-custom-content__panel">条目 A</div>
				</CarouselItem>
				<CarouselItem label="条目 B">
					<div class="v-carousel-custom-content__panel">条目 B</div>
				</CarouselItem>
				<CarouselItem label="条目 C">
					<div class="v-carousel-custom-content__panel">条目 C</div>
				</CarouselItem>
			</Carousel>
		</div>
	</div>
</template>

<script setup>
import { computed, h, ref } from 'vue';
import { Carousel, CarouselItem } from '..';
import { Select } from '../../select';

// 字符串按文本渲染：标签会原样显示
const MARKUP = '<b>加粗</b>的内容';
const KINDS = [
	{ value: 'string', label: '字符串（按文本）' },
	{ value: 'html', label: '{ type: \'html\' }' },
	{ value: 'render', label: '渲染函数' }
];
const VALUES = {
	string: MARKUP,
	html: { type: 'html', value: MARKUP },
	render: () => h('em', '渲染函数的内容')
};
const kind = ref('string');
const value = computed(() => VALUES[kind.value]);
</script>

<style lang="scss">
.v-carousel-custom-content {
	padding: 20px 240px 20px 20px;
	line-height: 22px;

	&__tip {
		margin: 8px 0 16px;
		color: #666;
	}

	&__controls {
		margin-bottom: 16px;

		.vc-select {
			width: 240px;
		}
	}

	&__stage {
		padding: 16px;
		border: 1px dashed #c5c8ce;
	}

	&__panel {
		height: 160px;
		line-height: 160px;
		text-align: center;
		background: #f8f8f9;
	}
}
</style>
