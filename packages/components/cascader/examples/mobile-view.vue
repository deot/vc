<template>
	<div class="vcm-cascader-view-demo">
		<h3>内嵌：搜索、禁用项</h3>
		<MCascaderView
			v-model="value"
			:data="data"
			searchable
			@select="handleSelect"
		/>
		<div class="vcm-cascader-view-demo__output">
			<span>value</span>
			<code>{{ stringify(value) }}</code>
		</div>
		<div class="vcm-cascader-view-demo__output">
			<span>select</span>
			<code>{{ selected }}</code>
		</div>

		<h3>异步加载子节点</h3>
		<MCascaderView
			v-model="asyncValue"
			:data="asyncData"
			:load-data="loadData"
		/>
		<div class="vcm-cascader-view-demo__output">
			<span>asyncValue</span>
			<code>{{ stringify(asyncValue) }}（加载 {{ loadCount }} 次）</code>
		</div>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { MCascaderView } from '../index.m';

const data = [
	{
		value: 'a',
		label: '分组 A',
		children: [
			{
				value: 'a-1',
				label: '条目 A-1',
				children: [
					{ value: 'a-1-1', label: '细项 A-1-1' },
					{ value: 'a-1-2', label: '细项 A-1-2', disabled: true }
				]
			},
			{ value: 'a-2', label: '条目 A-2' }
		]
	},
	{
		value: 'b',
		label: '分组 B',
		children: [
			{ value: 'b-1', label: '条目 B-1' },
			{ value: 'b-2', label: '条目 B-2' }
		]
	}
];

// 第三级起每一级都按需加载，加载到第四级为止
const asyncData = ref([
	{ value: 'x', label: '分组 X', children: [] },
	{ value: 'y', label: '分组 Y', children: [] }
]);

const value = ref([]);
const selected = ref('');
const asyncValue = ref([]);
const loadCount = ref(0);

const stringify = v => JSON.stringify(v);

const handleSelect = ({ values, labels, leaf }) => {
	selected.value = `${labels.join(' / ')}（${values.length} 级，${leaf ? '最后一级' : '还有下一级'}）`;
};

const loadData = ({ row, values }) => {
	loadCount.value++;
	return new Promise(resolve => setTimeout(() => resolve(
		Array.from({ length: 3 }, (_, i) => ({
			value: `${row.value}-${i + 1}`,
			label: `${row.label}-${i + 1}`,
			...(values.length < 3 ? { children: [] } : {})
		}))
	), 600));
};
</script>

<style lang="scss">
.vcm-cascader-view-demo {
	h3 {
		padding: 16px 16px 8px;
		margin: 0;
		font-size: 14px;
		font-weight: normal;
		color: #999;
	}

	&__output {
		display: grid;
		padding: 6px 12px 10px;
		font-size: 13px;
		border-bottom: 1px solid #eee;
		grid-template-columns: 100px minmax(0, 1fr);
		gap: 8px;

		code {
			word-break: break-all;
			white-space: pre-wrap;
		}
	}
}
</style>
