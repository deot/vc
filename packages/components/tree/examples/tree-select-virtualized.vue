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
			级联模式（cascader）下 virtualized 使每列只渲染可视范围附近的项，搜索结果同样如此；列宽固定，文字超出时省略。
			第一列每一项各有 10 个子项；第 3 项的子项与第一列数量相同，用来查看第二列的长列表。
		</p>

		<TreeSelect
			:key="remountKey"
			v-model="value"
			:data="data"
			:max="99999"
			cascader
			:virtualized="controls.virtualized === 'on'"
			:searchable="controls.searchable"
			clearable
			style="width: 320px"
		/>
		<div>value: {{ value.length }} 项</div>
	</div>
</template>
<script setup>
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue';
import { Select } from '../../select';
import { TreeSelect } from '..';

const CONTROLS = [
	{ key: 'virtualized', label: 'virtualized', data: [{ value: 'on', label: '开启' }, { value: 'off', label: '关闭' }] },
	{ key: 'count', label: '第一列数量', data: [1000, 5000].map(value => ({ value, label: `${value}` })) },
	{ key: 'searchable', label: '搜索方式', data: [{ value: 'inline', label: 'inline' }, { value: 'popover', label: 'popover' }] }
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
// 数量、模式变化时重新挂载
const remountKey = computed(() => Object.values(controls).join('-'));
watch(remountKey, () => (value.value = []), { immediate: true });

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
