<template>
	<div class="vcm-select-view-demo">
		<h3>内嵌：单选、搜索、分组</h3>
		<MSelectView
			v-model="value"
			:data="groupedData"
			searchable
			clearable
			@select="handleSelect"
		/>
		<div class="vcm-select-view-demo__output">
			<span>value</span>
			<code>{{ stringify(value) }}</code>
		</div>
		<div class="vcm-select-view-demo__output">
			<span>select</span>
			<code>{{ selected }}</code>
		</div>

		<h3>内嵌：多选（最多 2 项）</h3>
		<MSelectView v-model="multiple" :data="data" :max="2" clearable />
		<div class="vcm-select-view-demo__output">
			<span>multiple</span>
			<code>{{ stringify(multiple) }}</code>
		</div>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { MSelectView } from '../index.m';

const data = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: `条目 ${i + 1}`, disabled: i === 1 }));
const groupedData = [
	{ value: 'a', label: '分组 A', children: Array.from({ length: 6 }, (_, i) => ({ value: `a-${i + 1}`, label: `条目 A-${i + 1}` })) },
	{ value: 'b', label: '分组 B', children: Array.from({ length: 6 }, (_, i) => ({ value: `b-${i + 1}`, label: `条目 B-${i + 1}` })) }
];

const value = ref('b-2');
const multiple = ref([]);
const selected = ref('');

const stringify = v => JSON.stringify(v);

const handleSelect = ({ value: v, selected: isSelected }) => {
	selected.value = `${v}：${isSelected ? '选中' : '取消'}`;
};
</script>

<style lang="scss">
.vcm-select-view-demo {
	h3 {
		padding: 16px 16px 8px;
		margin: 0;
		font-size: 14px;
	}

	&__output {
		display: grid;
		padding: 6px 12px 10px;
		font-size: 13px;
		border-bottom: 1px solid #eee;
		grid-template-columns: 110px minmax(0, 1fr);
		gap: 8px;

		code {
			word-break: break-all;
			white-space: pre-wrap;
		}
	}
}
</style>
