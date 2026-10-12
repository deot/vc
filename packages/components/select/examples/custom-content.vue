<template>
	<div class="v-select-custom-content">
		<h3>Select：label</h3>
		<p class="v-select-custom-content__tip">前缀标签 label 支持字符串、渲染函数与 { type, value }；字符串按文本渲染。prepend 插槽会替换整个前缀。</p>
		<div class="v-select-custom-content__controls">
			<Select v-model="kind" :data="KINDS" label="内容" />
		</div>
		<div :key="kind" class="v-select-custom-content__stage">
			<Select v-model="current" :data="OPTIONS" :label="value" class="v-select-custom-content__target">
				<template v-if="kind === 'slot'" #prepend>
					<em>插槽的内容</em>
				</template>
			</Select>
		</div>
	</div>
</template>

<script setup>
import { computed, h, ref } from 'vue';
import { Select } from '..';

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

const OPTIONS = ['A', 'B', 'C'].map(i => ({ value: i, label: `选项 ${i}` }));
const current = ref('A');
</script>

<style lang="scss">
.v-select-custom-content {
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

	&__target {
		width: 360px;
	}
}
</style>
