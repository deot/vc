<!-- 移动端大量数据：每一级的项数可选；已选路径在各级中部，切换层级时滚到中间 -->
<template>
	<div class="m-cascader-virtualized">
		<MForm label-width="auto">
			<MFormItem v-for="item in CONTROLS" :key="item.key" :label="item.label">
				<MSelect v-model="controls[item.key]" :data="item.data" :title="item.label" />
			</MFormItem>
			<MFormItem label="选择条目">
				<MCascader
					:key="remountKey"
					v-model="value"
					:data="data"
					:virtualized="controls.virtualized === 'on'"
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
import { MCascader } from '../index.m';

const CONTROLS = [
	{ key: 'virtualized', label: 'virtualized', data: [{ value: 'on', label: '开启' }, { value: 'off', label: '关闭' }] },
	{ key: 'count', label: '第一级项数', data: [1000, 10000].map(value => ({ value, label: `${value}` })) }
];
const controls = reactive(Object.fromEntries(CONTROLS.map(({ key, data }) => [key, data[0].value])));

// 第一级 count 项，第二级每项 200 个条目
const data = computed(() => Array.from({ length: controls.count }, (_, i) => ({
	value: i,
	label: `分组 ${i}`,
	children: Array.from({ length: 200 }, (__, j) => ({ value: `${i}-${j}`, label: `条目 ${i}-${j}`, disabled: j % 50 === 7 }))
})));

const value = ref([]);
const remountKey = computed(() => `${controls.count}-${controls.virtualized}`);
watch(
	remountKey,
	() => {
		const middle = Math.floor(controls.count / 2);
		value.value = [middle, `${middle}-100`];
	},
	{ immediate: true }
);

window.$perf?.observe();
watch(controls, () => window.$perf?.reset());
onBeforeUnmount(() => window.$perf?.disconnect());
</script>
