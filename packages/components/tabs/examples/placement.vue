<template>
	<div class="v-tabs-placement">
		<div class="v-tabs-placement__controls">
			<Select v-model="placement" :data="PLACEMENTS" label="placement" />
			<Select v-model="type" :data="TYPES" label="type" />
			<Select v-model="size" :data="SIZES" label="size" />
			<Select v-model="count" :data="COUNTS" label="数量" />
			<Select v-model="height" :data="HEIGHTS" label="高度" />
		</div>
		<Tabs
			v-model="current"
			:placement="placement"
			:type="type"
			:size="size"
			:style="{ height }"
			closable
			animated
			class="v-tabs-placement__tabs"
			@tab-remove="handleRemove"
		>
			<template #extra>
				<span>共 {{ items.length }} 项</span>
			</template>
			<TabsPane
				v-for="item in items"
				:key="item.value"
				:value="item.value"
				:label="item.label"
				:disabled="item.disabled"
				closable
			>
				<div class="v-tabs-placement__pane">
					<p v-for="line in 4" :key="line">{{ item.label }}的内容，第 {{ line }} 行</p>
				</div>
			</TabsPane>
		</Tabs>
		<p>当前值：{{ current }}。高度设为 240px 且标签较多时，纵向标签栏可滚动。</p>
	</div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { Tabs, TabsPane } from '..';
import { Select } from '../../select';

const toOptions = list => list.map(value => ({ value, label: String(value) }));
const PLACEMENTS = toOptions(['top', 'bottom', 'left', 'right']);
const TYPES = toOptions(['line', 'card', 'button', 'capsule', 'text', 'round']);
const SIZES = toOptions(['mini', 'small', 'medium', 'large']);
const COUNTS = [6, 20].map(value => ({ value, label: `${value} 项` }));
const HEIGHTS = [
	{ value: 'auto', label: '自适应' },
	{ value: '240px', label: '240px' }
];

const placement = ref('left');
const type = ref('line');
const size = ref('medium');
const count = ref(6);
const height = ref('auto');
const items = ref([]);
const current = ref();

watch(count, (n) => {
	items.value = Array.from({ length: n }, (_, i) => ({
		value: `item-${i + 1}`,
		label: i % 4 === 2 ? `较长的条目 ${i + 1}` : `条目 ${i + 1}`,
		disabled: i === 3
	}));
	current.value = items.value[0].value;
}, { immediate: true });

const handleRemove = (value, index) => {
	items.value.splice(index, 1);
	if (current.value === value) {
		current.value = items.value[Math.max(0, index - 1)]?.value;
	}
};
</script>

<style scoped>
.v-tabs-placement {
	padding: 20px;
}

.v-tabs-placement__controls {
	display: flex;
	flex-wrap: wrap;
	gap: 12px;
	margin-bottom: 16px;
}

.v-tabs-placement__controls .vc-select {
	width: 160px;
}

.v-tabs-placement__tabs {
	padding: 12px;
	border: 1px dashed var(--vc-color-neutral-light);
}

.v-tabs-placement__pane p {
	margin: 0 0 8px;
}
</style>
