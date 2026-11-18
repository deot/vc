<!-- 移动端大量数据：virtualized 开关、数量、分组；已选项在列表中部，打开时滚到中间 -->
<template>
	<div class="m-select-virtualized">
		<MForm label-width="auto">
			<MFormItem v-for="item in CONTROLS" :key="item.key" :label="item.label">
				<MSelect v-model="controls[item.key]" :data="item.data" :title="item.label" />
			</MFormItem>
			<MFormItem label="选择条目">
				<MSelect
					:key="remountKey"
					v-model="value"
					:data="data"
					:virtualized="controls.virtualized === 'on'"
					:max="controls.mode === 'multiple' ? 0 : 1"
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
import { MSelect } from '../index.m';

const CONTROLS = [
	{ key: 'virtualized', label: 'virtualized', data: [{ value: 'on', label: '开启' }, { value: 'off', label: '关闭' }] },
	{ key: 'count', label: '数量', data: [1000, 10000, 50000].map(value => ({ value, label: `${value}` })) },
	{ key: 'group', label: '分组', data: [{ value: 'none', label: '不分组' }, { value: 'group', label: '每 100 项一组' }] },
	{ key: 'mode', label: '选择', data: [{ value: 'single', label: '单选' }, { value: 'multiple', label: '多选' }] }
];
const controls = reactive(Object.fromEntries(CONTROLS.map(({ key, data }) => [key, data[0].value])));

const createOption = index => ({
	value: index + 1,
	label: `条目 ${index + 1}`,
	description: index % 9 === 4 ? '说明文字' : void 0,
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
// 条件变化时重新挂载：已选值落在列表中部
const remountKey = computed(() => `${controls.count}-${controls.group}-${controls.mode}-${controls.virtualized}`);
watch(
	remountKey,
	() => {
		const middle = Math.floor(controls.count / 2);
		value.value = controls.mode === 'multiple' ? [middle, middle + 3] : middle;
	},
	{ immediate: true }
);

window.$perf?.observe();
watch(controls, () => window.$perf?.reset());
onBeforeUnmount(() => window.$perf?.disconnect());
</script>
