<template>
	<div class="v-card-custom-content">
		<h3>Card：title</h3>
		<p class="v-card-custom-content__tip">title 支持字符串、渲染函数与 { type, value }；字符串按文本渲染。title 插槽会替换整个标题（包括图标）。</p>
		<div class="v-card-custom-content__controls">
			<Select v-model="kind" :data="KINDS" label="内容" />
		</div>
		<div :key="kind" class="v-card-custom-content__stage">
			<Card :title="value" icon="close">
				<template v-if="kind === 'slot'" #title>
					<em>插槽的内容</em>
				</template>
				卡片内容
			</Card>
		</div>
	</div>
</template>

<script setup>
import { computed, h, ref } from 'vue';
import { Card } from '..';
import { Select } from '../../select';

// 字符串按文本渲染：标签会原样显示
const MARKUP = '<b>加粗</b>的内容';
const KINDS = [
	{ value: 'string', label: '字符串（按文本）' },
	{ value: 'html', label: '{ type: \'html\' }' },
	{ value: 'render', label: '渲染函数' },
	{ value: 'slot', label: '插槽' }
];
const VALUES = {
	string: MARKUP,
	html: { type: 'html', value: MARKUP },
	render: () => h('em', '渲染函数的内容'),
	slot: MARKUP
};
const kind = ref('string');
const value = computed(() => VALUES[kind.value]);
</script>

<style lang="scss">
.v-card-custom-content {
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
}
</style>
