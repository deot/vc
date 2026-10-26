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
			virtualized 时只渲染滚动容器可视范围附近的节点，沿用所在的滚动容器（这里是固定高度的 Scroller，或页面本身）。
			展开 / 收起、键盘（↑ ↓ ← →、Enter）、勾选与拖拽的行为不变；每个分组 10 个子分组，每个子分组 10 个条目。
		</p>

		<component
			:is="controls.container === 'scroller' ? Scroller : 'div'"
			:key="remountKey"
			v-bind="controls.container === 'scroller' ? { height: '400px', class: 'virtualized-example__scroller' } : {}"
		>
			<Tree
				:data="data"
				:virtualized="controls.virtualized === 'on'"
				:default-expand-all="controls.expand === 'all'"
				:show-checkbox="controls.checkbox === 'on'"
				:draggable="controls.draggable === 'on'"
			/>
		</component>
	</div>
</template>
<script setup>
import { computed, onBeforeUnmount, reactive, watch } from 'vue';
import { Select } from '../../select';
import { Scroller } from '../../scroller';
import { Tree } from '..';

const CONTROLS = [
	{ key: 'virtualized', label: 'virtualized', data: [{ value: 'on', label: '开启' }, { value: 'off', label: '关闭' }] },
	{ key: 'count', label: '条目数量', data: [1000, 10000, 50000].map(value => ({ value, label: `${value}` })) },
	{ key: 'expand', label: '展开', data: [{ value: 'all', label: '全部展开' }, { value: 'none', label: '全部收起' }] },
	{ key: 'container', label: '滚动容器', data: [{ value: 'scroller', label: 'Scroller（400px）' }, { value: 'page', label: '页面' }] },
	{ key: 'checkbox', label: '复选框', data: [{ value: 'on', label: '显示' }, { value: 'off', label: '隐藏' }] },
	{ key: 'draggable', label: '拖拽', data: [{ value: 'off', label: '关闭' }, { value: 'on', label: '开启' }] }
];
const controls = reactive(Object.fromEntries(CONTROLS.map(({ key, data }) => [key, data[0].value])));

const label = (prefix, index) => (index % 9 === 4 ? `${prefix} 名称较长的一项` : prefix);
const data = computed(() => Array.from({ length: controls.count / 100 }, (_, i) => ({
	value: `${i + 1}`,
	label: label(`分组 ${i + 1}`, i),
	children: Array.from({ length: 10 }, (__, j) => ({
		value: `${i + 1}-${j + 1}`,
		label: label(`子分组 ${i + 1}-${j + 1}`, j),
		children: Array.from({ length: 10 }, (___, k) => ({
			value: `${i + 1}-${j + 1}-${k + 1}`,
			label: label(`条目 ${i + 1}-${j + 1}-${k + 1}`, k)
		}))
	}))
})));

// 任一选项变化时重新挂载
const remountKey = computed(() => Object.values(controls).join('-'));

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

	&__scroller {
		max-width: 480px;
		border: 1px solid var(--vc-color-light-deeper);
	}
}
</style>
