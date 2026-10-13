<template>
	<div class="search-example">
		<div class="search-example__controls">
			<Select
				v-for="item in CONTROLS"
				:key="item.key"
				v-model="controls[item.key]"
				:data="item.data"
				:label="item.label"
			/>
		</div>

		<p>
			inline：点击后直接在输入框里输入，输入为空时退格移除最后一个标签；popover：搜索栏在弹层顶部。
			树形保留层级过滤，级联列展示扁平的路径列表。
			键盘：级联列用方向键移动、回车勾选；树形按 ↓ 进入树，Esc 关闭并回到输入框。
		</p>

		<div :style="{ width: `${controls.width}px` }">
			<TreeSelect
				:key="controls.content"
				v-model="value"
				:data="data"
				:max="99"
				:cascader="controls.content === 'cascader'"
				:check-strictly="controls.checkStrictly === 'on'"
				:max-tag-lines="controls.maxTagLines"
				:searchable="controls.searchable !== 'off' && controls.searchable"
				search-placeholder="输入条目或分组名称"
				clearable
			/>
		</div>
		<div>value: {{ value }}</div>
	</div>
</template>
<script setup>
import { reactive, ref, watch } from 'vue';
import { Select } from '../../select';
import { TreeSelect } from '..';

// 对照项：每项一个 Select
const CONTROLS = [
	{
		key: 'searchable',
		label: '搜索方式',
		data: [{ value: 'inline', label: 'inline（触发器内输入）' }, { value: 'popover', label: 'popover（弹层搜索栏）' }, { value: 'off', label: '关闭' }]
	},
	{ key: 'content', label: '内容', data: [{ value: 'tree', label: '树形' }, { value: 'cascader', label: '级联列' }] },
	{ key: 'checkStrictly', label: 'checkStrictly', data: [{ value: 'off', label: '关闭（父子联动）' }, { value: 'on', label: '开启（各自独立）' }] },
	{ key: 'maxTagLines', label: 'maxTagLines', data: [{ value: 1, label: '1' }, { value: 2, label: '2' }, { value: 0, label: '0（不限行）' }] },
	{ key: 'width', label: '宽度', data: [320, 200, 120].map(value => ({ value, label: `${value}px` })) }
];
const controls = reactive(Object.fromEntries(CONTROLS.map(({ key, data }) => [key, data[0].value])));

const data = ['A', 'B', 'C'].map(group => ({
	value: group,
	label: `分组 ${group}`,
	children: [1, 2, 3].map(sub => ({
		value: `${group}-${sub}`,
		label: `子分组 ${group}${sub}`,
		children: [1, 2, 3, 4].map(n => ({
			value: `${group}-${sub}-${n}`,
			label: `条目 ${group}${sub}-${n}`,
			disabled: group === 'A' && sub === 1 && n === 4
		}))
	}))
}));

const value = ref([]);
// 内容形态、勾选方式变化时值回到初始状态
watch(
	() => [controls.content, controls.checkStrictly],
	() => {
		value.value = ['A-1-1', 'A-1-2', 'B-2-1'];
	},
	{ immediate: true }
);
</script>
<style lang="scss">
.search-example {
	padding: 40px;

	// 右上角留给主题 / 变量 / 性能按钮
	&__controls {
		display: grid;
		max-width: 720px;
		margin-right: 220px;
		grid-template-columns: repeat(3, 1fr);
		gap: 12px;
	}
}
</style>
