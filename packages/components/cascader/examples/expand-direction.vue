<template>
	<div class="expand-direction-demo">
		<div class="expand-direction-demo__controls">
			<Select
				v-for="item in CONTROLS"
				:key="item.key"
				v-model="controls[item.key]"
				:data="item.data"
				:label="item.label"
			/>
		</div>

		<p>
			触发器较窄。靠右时右侧放不下多级列：默认（right）弹层整体左移贴住视口右边，指针在弹层内收起列时弹层不平移、空出的部分以白底占满，移出后收回；
			left 始终向左展开（根列贴着触发器）；auto 在右侧放不下时向左展开。居中且层级较深时两侧都放不下，按空间更大的一侧展开后左移贴边。
		</p>

		<div :class="`expand-direction-demo__row is-${controls.position}`">
			<Cascader
				:key="controls.depth"
				v-model="value"
				:data="data"
				:expand-direction="controls.expandDirection"
				class="expand-direction-demo__trigger"
				portal-class="expand-direction-demo__popup"
			/>
		</div>
		<div>value: {{ value }}</div>
	</div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { Cascader } from '..';
import { Select } from '../../select';

const CONTROLS = [
	{ key: 'expandDirection', label: 'expandDirection', data: ['right', 'left', 'auto'].map(value => ({ value, label: value })) },
	{ key: 'position', label: '位置', data: [{ value: 'end', label: '靠右' }, { value: 'center', label: '居中' }, { value: 'start', label: '靠左' }] },
	{ key: 'depth', label: '层级', data: [{ value: 4, label: '4 级' }, { value: 6, label: '6 级' }] }
];

const controls = reactive(Object.fromEntries(CONTROLS.map(({ key, data }) => [key, data[0].value])));

// 同一列的文字长度随上一级选中项而变，部分选项没有下一级：移入不同选项时列宽、列数都会变化
const make = (prefix, level, depth) => {
	const hash = [...prefix].reduce((sum, c) => (sum * 31 + c.charCodeAt(0)) % 9973, 0);
	const extra = '较长'.repeat(hash % 4);
	return Array.from({ length: 6 }, (_, i) => {
		const value = `${prefix}-${i}`;
		const label = `${extra}选项 ${value.slice(2)}`;
		const isLeaf = level === depth || i % 3 === 2;
		return isLeaf ? { value, label } : { value, label, children: make(value, level + 1, depth) };
	});
};

const data = computed(() => make('n', 1, controls.depth));
const value = ref([]);
watch(() => controls.depth, () => (value.value = []));
</script>

<style>
.expand-direction-demo__controls {
	display: grid;
	max-width: 720px;
	margin-right: 220px;
	grid-template-columns: repeat(3, 1fr);
	gap: 12px;
}

.expand-direction-demo__row {
	display: flex;
	margin: 20px 0;
}

.expand-direction-demo__row.is-end {
	justify-content: flex-end;
}

.expand-direction-demo__row.is-center {
	justify-content: center;
}

.expand-direction-demo__row.is-start {
	justify-content: flex-start;
}

.expand-direction-demo__trigger {
	width: 120px !important;
}
</style>
