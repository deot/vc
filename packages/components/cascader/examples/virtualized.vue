<template>
	<div class="virtualized-example">
		<div class="virtualized-example__controls">
			<Select
				v-for="item in CONTROLS"
				:key="item.key"
				v-model="controls[item.key]"
				:data="item.data"
				:label="item.label"
			/>
		</div>

		<p>
			virtualized 时每列只渲染可视范围附近的项，搜索结果同样如此；列宽固定（--vc-cascader-column-width，默认 160px），文字超出时省略，悬停显示完整文字。
			第一列每一项各有 10 个子项；第 3 项的子项与第一列数量相同，用来查看第二列的长列表。
		</p>

		<Cascader
			:key="remountKey"
			v-model="value"
			:data="data"
			:virtualized="controls.virtualized === 'on'"
			:searchable="controls.searchable === 'on'"
			:change-on-select="controls.changeOnSelect === 'on'"
			clearable
			style="width: 320px"
		/>
		<div>value: {{ value }}</div>
	</div>
</template>
<script setup>
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue';
import { Cascader } from '..';
import { Select } from '../../select';

const CONTROLS = [
	{ key: 'virtualized', label: 'virtualized', data: [{ value: 'on', label: '开启' }, { value: 'off', label: '关闭' }] },
	{ key: 'count', label: '第一列数量', data: [1000, 10000].map(value => ({ value, label: `${value}` })) },
	{ key: 'searchable', label: '搜索', data: [{ value: 'on', label: '开启' }, { value: 'off', label: '关闭' }] },
	{ key: 'changeOnSelect', label: 'changeOnSelect', data: [{ value: 'off', label: '关闭（只能选末级）' }, { value: 'on', label: '开启' }] }
];
const controls = reactive(Object.fromEntries(CONTROLS.map(({ key, data }) => [key, data[0].value])));

const createChildren = (parent, count) => Array.from({ length: count }, (_, index) => ({
	value: `${parent}-${index + 1}`,
	label: index % 9 === 4 ? `条目 ${parent}-${index + 1} 名称较长的一项` : `条目 ${parent}-${index + 1}`
}));

const data = computed(() => Array.from({ length: controls.count }, (_, index) => ({
	value: `${index + 1}`,
	label: index % 9 === 4 ? `分组 ${index + 1} 名称较长的一项` : `分组 ${index + 1}`,
	children: createChildren(index + 1, index === 2 ? controls.count : 10)
})));

const value = ref([]);
// 数量、模式变化时重新挂载：已选值落在两列的中部，打开时各列滚动到它
const remountKey = computed(() => Object.values(controls).join('-'));
watch(
	remountKey,
	() => {
		value.value = ['3', `3-${Math.floor(controls.count / 2)}`];
	},
	{ immediate: true }
);

window.$perf?.observe();
watch(controls, () => window.$perf?.reset());
onBeforeUnmount(() => window.$perf?.disconnect());
</script>
<style lang="scss">
.virtualized-example {
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
