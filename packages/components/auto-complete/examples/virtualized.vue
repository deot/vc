<!-- virtualized：只渲染弹层可视范围附近的联想项；打开、输入与方向键的耗时不随数量增长 -->
<template>
	<div class="auto-complete-virtualized">
		<div class="auto-complete-virtualized__controls">
			<Select
				v-for="item in CONTROLS"
				:key="item.key"
				v-model="controls[item.key]"
				:data="item.data"
				:label="item.label"
			/>
		</div>
		<div style="width: 320px">
			<AutoComplete
				:key="remountKey"
				v-model="value"
				:data="data"
				:virtualized="controls.virtualized === 'on'"
				placeholder="聚焦即显示全部，输入数字过滤"
			/>
		</div>
		<div>value: {{ value }}</div>
	</div>
</template>
<script setup>
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue';
import { AutoComplete } from '..';
import { Select } from '../../select';

const CONTROLS = [
	{ key: 'virtualized', label: 'virtualized', data: [{ value: 'on', label: '开启' }, { value: 'off', label: '关闭' }] },
	{ key: 'count', label: '数量', data: [1000, 10000, 50000].map(value => ({ value, label: `${value}` })) },
	{ key: 'group', label: '分组', data: [{ value: 'none', label: '不分组' }, { value: 'group', label: '每 100 项一组' }] }
];
const controls = reactive(Object.fromEntries(CONTROLS.map(({ key, data }) => [key, data[0].value])));

const data = computed(() => {
	const options = Array.from({ length: controls.count }, (_, index) => ({
		value: `条目 ${index + 1}`,
		disabled: index % 50 === 7
	}));
	if (controls.group === 'none') return options;
	return Array.from({ length: Math.ceil(options.length / 100) }, (_, index) => ({
		value: `g${index + 1}`,
		label: `分组 ${index + 1}`,
		children: options.slice(index * 100, index * 100 + 100)
	}));
});

const value = ref('');
const remountKey = computed(() => `${controls.count}-${controls.group}-${controls.virtualized}`);

window.$perf?.observe();
watch(controls, () => window.$perf?.reset());
onBeforeUnmount(() => window.$perf?.disconnect());
</script>
<style lang="scss">
.auto-complete-virtualized {
	display: flex;
	padding: 40px;
	flex-direction: column;
	gap: 16px;

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
