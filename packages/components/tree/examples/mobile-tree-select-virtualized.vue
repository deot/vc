<!-- 移动端大量节点：virtualized 开关与数量；已选节点在中部，打开时展开并滚到中间 -->
<template>
	<div class="m-tree-select-virtualized">
		<MForm label-width="auto">
			<MFormItem v-for="item in CONTROLS" :key="item.key" :label="item.label">
				<MSelect v-model="controls[item.key]" :data="item.data" :title="item.label" />
			</MFormItem>
			<MFormItem label="选择条目">
				<MTreeSelect
					:key="remountKey"
					v-model="value"
					:data="data"
					:virtualized="controls.virtualized === 'on'"
					:max="0"
					title="选择条目"
					searchable
					clearable
				/>
			</MFormItem>
		</MForm>
	</div>
</template>
<script setup>
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue';
import { MForm, MFormItem } from '../../form/index.m';
import { MSelect } from '../../select/index.m';
import { MTreeSelect } from '../index.m';

const CONTROLS = [
	{ key: 'virtualized', label: 'virtualized', data: [{ value: 'on', label: '开启' }, { value: 'off', label: '关闭' }] },
	{ key: 'count', label: '分组数', data: [1000, 5000].map(value => ({ value, label: `${value}（每组 3 项）` })) }
];
const controls = reactive(Object.fromEntries(CONTROLS.map(({ key, data }) => [key, data[0].value])));

const data = computed(() => Array.from({ length: controls.count }, (_, i) => ({
	value: `${i}`,
	label: `分组 ${i}`,
	children: Array.from({ length: 3 }, (__, j) => ({ value: `${i}-${j}`, label: `条目 ${i}-${j}` }))
})));

const value = ref([]);
const remountKey = computed(() => `${controls.count}-${controls.virtualized}`);
watch(
	remountKey,
	() => {
		const middle = Math.floor(controls.count / 2);
		value.value = [`${middle}-1`];
	},
	{ immediate: true }
);

window.$perf?.observe();
watch(controls, () => window.$perf?.reset());
onBeforeUnmount(() => window.$perf?.disconnect());
</script>
