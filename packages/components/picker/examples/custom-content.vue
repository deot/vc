<template>
	<div class="v-picker-custom-content">
		<h3>Picker：title</h3>
		<p class="v-picker-custom-content__tip">点击条目打开弹层，title 显示在取消与确定之间。字符串按 HTML 渲染（与此前一致），也支持渲染函数与 { type, value }；用 { type: 'text' } 可以按文本显示。</p>
		<div class="v-picker-custom-content__controls">
			<Select v-model="kind" :data="KINDS" label="内容" />
		</div>
		<div :key="kind" class="v-picker-custom-content__stage">
			<Picker v-model="current" :data="DATA" :title="value" label="选项" />
		</div>
	</div>
</template>

<script setup>
import { computed, h, ref } from 'vue';
import { Picker } from '..';
import { Select } from '../../select';

// title 的字符串按 HTML 渲染（与此前一致）；需要原样显示标签时用 { type: 'text' }
const MARKUP = '<b>加粗</b>的内容';
const KINDS = [
	{ value: 'string', label: '字符串（按 HTML）' },
	{ value: 'text', label: '{ type: \'text\' }' },
	{ value: 'render', label: '渲染函数' }
];
const VALUES = {
	string: MARKUP,
	text: { type: 'text', value: MARKUP },
	render: () => h('em', '渲染函数的内容')
};
const kind = ref('string');
const value = computed(() => VALUES[kind.value]);

const DATA = ['A', 'B', 'C'].map(i => ({ value: i, label: `选项 ${i}` }));
const current = ref(['A']);
</script>

<style lang="scss">
.v-picker-custom-content {
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
