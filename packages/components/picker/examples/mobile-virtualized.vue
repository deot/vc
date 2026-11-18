<!-- 移动端大量选项：滚轮列只渲染可见窗口；年份范围很大的 MDatePicker -->
<template>
	<div class="m-picker-virtualized">
		<MForm label-width="auto">
			<MFormItem v-for="item in CONTROLS" :key="item.key" :label="item.label">
				<MSelect v-model="controls[item.key]" :data="item.data" :title="item.label" />
			</MFormItem>
			<MFormItem label="选择条目">
				<MPicker
					:key="remountKey"
					v-model="value"
					:data="data"
					:columns="2"
					:virtualized="controls.virtualized === 'on'"
					title="选择条目"
				/>
			</MFormItem>
			<MFormItem label="年份（1000–3000）">
				<MDatePicker
					:key="remountKey"
					v-model="date"
					type="year"
					:year-range="[1000, 3000]"
					:virtualized="controls.virtualized === 'on'"
				/>
			</MFormItem>
		</MForm>
	</div>
</template>
<script setup>
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue';
import { MForm, MFormItem } from '../../form/index.m';
import { MSelect } from '../../select/index.m';
import { MDatePicker } from '../../date-picker/index.m';
import { MPicker } from '../index.m';

const CONTROLS = [
	{ key: 'virtualized', label: 'virtualized', data: [{ value: 'on', label: '开启' }, { value: 'off', label: '关闭' }] },
	{ key: 'count', label: '第一列项数', data: [1000, 10000].map(value => ({ value, label: `${value}` })) }
];
const controls = reactive(Object.fromEntries(CONTROLS.map(({ key, data }) => [key, data[0].value])));

// 联动两列：第一列 count 项，第二列每项 100 个条目
const data = computed(() => Array.from({ length: controls.count }, (_, i) => ({
	value: i,
	label: `分组 ${i}`,
	children: Array.from({ length: 100 }, (__, j) => ({ value: `${i}-${j}`, label: `条目 ${i}-${j}`, disabled: j % 20 === 7 }))
})));

const value = ref([]);
const date = ref('2026');
const remountKey = computed(() => `${controls.count}-${controls.virtualized}`);
watch(
	remountKey,
	() => {
		const middle = Math.floor(controls.count / 2);
		value.value = [middle, `${middle}-50`];
	},
	{ immediate: true }
);

window.$perf?.observe();
watch(controls, () => window.$perf?.reset());
onBeforeUnmount(() => window.$perf?.disconnect());
</script>
