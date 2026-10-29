<template>
	<div class="descriptions-example">
		<p>
			labelPosition：left / right 标签在左侧并按该方向对齐，top 标签在上方；labelWidth 固定标签宽度使各行对齐，auto 时同一列的标签取其中最宽的；
			inline 时标签和值按文字流排列。columns 与 Grid 相同，也支持轨道模板；getSpan 写法同 Table
		</p>
		<div class="descriptions-example__controls">
			<Select
				v-for="item in CONTROLS"
				:key="item.key"
				v-model="controls[item.key]"
				:data="item.data"
				:label="item.label"
			/>
		</div>

		<Descriptions
			:theme="controls.theme"
			:label-position="controls.labelPosition"
			:label-width="controls.labelWidth || undefined"
			:inline="controls.inline"
			:columns="layout.columns"
			:span="layout.span"
			:get-span="layout.getSpan"
			:data="data"
			:options="options"
		/>
	</div>
</template>
<script setup>
import { computed, reactive } from 'vue';
import { Select } from '../../select';
import { Descriptions } from '..';

const toData = values => values.map(value => ({ value, label: String(value) }));
const LAYOUTS = {
	default: { label: '默认（24 格，span 8）' },
	half: { label: 'span 12（每行 2 项）', span: 12 },
	three: { label: 'columns 3，span 1', columns: 3, span: 1 },
	merge: {
		label: 'getSpan：第 1 项跨 2 行',
		getSpan: ({ index }) => (index === 0 ? [2, 8] : void 0)
	}
};
const CONTROLS = [
	{ key: 'theme', label: 'theme', data: toData(['fill', 'inverted', 'plain', 'border']) },
	{ key: 'labelPosition', label: 'labelPosition', data: toData(['left', 'right', 'top']) },
	{
		key: 'labelWidth',
		label: 'labelWidth',
		data: [{ value: 0, label: '按内容' }, { value: 'auto', label: 'auto' }, { value: 80, label: '80' }, { value: 120, label: '120' }]
	},
	{ key: 'inline', label: 'inline', data: [{ value: false, label: 'false' }, { value: true, label: 'true' }] },
	{ key: 'layout', label: '分列', data: Object.entries(LAYOUTS).map(([value, { label }]) => ({ value, label })) }
];
const controls = reactive(Object.fromEntries(CONTROLS.map(({ key, data }) => [key, data[0].value])));
const layout = computed(() => LAYOUTS[controls.layout]);

const data = {
	code: 'NO-000128',
	name: '条目 128',
	type: '类型 A',
	group: '分组 B',
	status: '进行中',
	date: '2026-10-28',
	desc: '说明文字说明文字说明文字说明文字说明文字说明文字说明文字说明文字说明文字说明文字说明文字说明文字'
};
const options = [
	{ label: '编号', prop: 'code' },
	{ label: '名称', prop: 'name' },
	{ label: '类型', prop: 'type' },
	{ label: '所属分组', prop: 'group' },
	{ label: '状态', prop: 'status', tooltip: '状态的说明' },
	{ label: '日期', prop: 'date' },
	{ label: '说明', prop: 'desc', span: 24 }
];
</script>
<style scoped>
.descriptions-example {
	padding: 20px;
}

.descriptions-example__controls {
	display: flex;
	flex-wrap: wrap;
	gap: 12px;
	margin-bottom: 12px;
}

.descriptions-example__controls .vc-select {
	width: 240px;
}
</style>
