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
			virtualized 时只渲染弹层可视范围附近的选项，搜索结果同样如此；打开、搜索与方向键的耗时不随数量增长。
			分组标题与选项同为列表的行；多选且有搜索词时出现全选，作用于全部搜索结果。
		</p>

		<div style="width: 320px">
			<Select
				:key="remountKey"
				v-model="value"
				:data="data"
				:virtualized="controls.virtualized === 'on'"
				:max="controls.mode === 'multiple' ? 99999 : 1"
				:searchable="controls.searchable"
				clearable
			/>
		</div>
		<div>value: {{ Array.isArray(value) ? `${value.length} 项` : value }}</div>
	</div>
</template>
<script setup>
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue';
import { Select } from '..';

const CONTROLS = [
	{ key: 'virtualized', label: 'virtualized', data: [{ value: 'on', label: '开启' }, { value: 'off', label: '关闭' }] },
	{ key: 'count', label: '数量', data: [1000, 10000, 50000].map(value => ({ value, label: `${value}` })) },
	{ key: 'group', label: '分组', data: [{ value: 'none', label: '不分组' }, { value: 'group', label: '每 100 项一组' }] },
	{ key: 'mode', label: '选择', data: [{ value: 'single', label: '单选' }, { value: 'multiple', label: '多选' }] },
	{ key: 'searchable', label: '搜索方式', data: [{ value: 'inline', label: 'inline' }, { value: 'popover', label: 'popover' }] }
];
const controls = reactive(Object.fromEntries(CONTROLS.map(({ key, data }) => [key, data[0].value])));

const createOption = index => ({
	value: index + 1,
	label: index % 9 === 4 ? `条目 ${index + 1} 名称较长的一项` : `条目 ${index + 1}`,
	disabled: index % 50 === 7
});

const data = computed(() => {
	const options = Array.from({ length: controls.count }, (_, index) => createOption(index));
	if (controls.group === 'none') return options;
	return Array.from({ length: Math.ceil(options.length / 100) }, (_, index) => ({
		value: `g${index + 1}`,
		label: `分组 ${index + 1}`,
		children: options.slice(index * 100, index * 100 + 100)
	}));
});

const value = ref();
// 数量、分组、选择方式变化时重新挂载：已选值落在列表中部，打开时滚动到它
const remountKey = computed(() => `${controls.count}-${controls.group}-${controls.mode}-${controls.virtualized}`);
watch(
	remountKey,
	() => {
		const middle = Math.floor(controls.count / 2);
		value.value = controls.mode === 'multiple' ? [middle, middle + 3, middle + 10] : middle;
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
