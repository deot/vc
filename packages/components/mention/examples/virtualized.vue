<!-- virtualized：只渲染弹层可视范围附近的联想项 -->
<template>
	<div class="mention-virtualized">
		<div class="mention-virtualized__controls">
			<Select
				v-for="item in CONTROLS"
				:key="item.key"
				v-model="controls[item.key]"
				:data="item.data"
				:label="item.label"
			/>
		</div>
		<Mention
			:key="remountKey"
			v-model="value"
			:data="data"
			:virtualized="controls.virtualized === 'on'"
			:rows="4"
			placeholder="输入 @ 后输入数字过滤"
		/>
	</div>
</template>
<script setup>
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue';
import { Mention } from '..';
import { Select } from '../../select';

const CONTROLS = [
	{ key: 'virtualized', label: 'virtualized', data: [{ value: 'on', label: '开启' }, { value: 'off', label: '关闭' }] },
	{ key: 'count', label: '数量', data: [1000, 10000, 50000].map(value => ({ value, label: `${value}` })) }
];
const controls = reactive(Object.fromEntries(CONTROLS.map(({ key, data }) => [key, data[0].value])));

const data = computed(() => Array.from({ length: controls.count }, (_, index) => `成员${index + 1}`));
const value = ref('');
const remountKey = computed(() => `${controls.count}-${controls.virtualized}`);

window.$perf?.observe();
watch(controls, () => window.$perf?.reset());
onBeforeUnmount(() => window.$perf?.disconnect());
</script>
<style lang="scss">
.mention-virtualized {
	display: flex;
	max-width: 480px;
	padding: 40px;
	flex-direction: column;
	gap: 16px;

	// 右上角留给主题 / 变量 / 性能按钮
	&__controls {
		display: grid;
		margin-right: 220px;
		grid-template-columns: repeat(2, 1fr);
		gap: 12px;
	}
}
</style>
