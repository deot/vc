<template>
	<div class="v-list-custom-content">
		<h3>MListItem：label / extra</h3>
		<p class="v-list-custom-content__tip">label 与 extra 支持字符串、渲染函数与 { type, value }；字符串按文本渲染。同名插槽优先。</p>
		<div class="v-list-custom-content__controls">
			<Select v-model="kind" :data="KINDS" label="内容" />
		</div>
		<div :key="kind" class="v-list-custom-content__stage">
			<MList>
				<MListItem :label="value" :extra="value">
					<template v-if="kind === 'slot'" #label>
						<em>插槽的内容</em>
					</template>
					<template v-if="kind === 'slot'" #extra>
						<em>插槽的内容</em>
					</template>
				</MListItem>
				<MListItem label="条目 B" extra="说明" />
			</MList>
		</div>
	</div>
</template>

<script setup>
import { computed, h, ref } from 'vue';
import { MList, MListItem } from '../index.m';
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
.v-list-custom-content {
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
