<template>
	<div class="v-table-custom-content">
		<h3>Table：emptyText</h3>
		<p class="v-table-custom-content__tip">没有数据时显示 emptyText，支持字符串、渲染函数与 { type, value }；字符串按文本渲染。empty 插槽优先。</p>
		<div class="v-table-custom-content__controls">
			<Select v-model="kind" :data="KINDS" label="内容" />
		</div>
		<div :key="kind" class="v-table-custom-content__stage">
			<Table :data="[]" :empty-text="value">
				<TableColumn label="名称" prop="name" />
				<TableColumn label="说明" prop="desc" />
				<template v-if="kind === 'slot'" #empty>
					<em>插槽的内容</em>
				</template>
			</Table>
		</div>
	</div>
</template>

<script setup>
import { computed, h, ref } from 'vue';
import { Table, TableColumn } from '..';
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
.v-table-custom-content {
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
