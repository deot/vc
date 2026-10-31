<template>
	<div class="v-tabs-overflow">
		<div class="v-tabs-overflow__controls">
			<Select v-model="count" :data="COUNTS" label="数量" />
			<Select v-model="type" :data="TYPES" label="type" />
			<Select v-model="width" :data="WIDTHS" label="容器宽度" />
			<Select v-model="stepper" :data="STEPPERS" label="stepper" />
			<Button @click="handleAdd">添加</Button>
			<Button @click="handleRemoveCurrent">删除当前</Button>
		</div>
		<!-- 数量变化时重新挂载，便于观察首次定位（选中末项时无动画直接定位） -->
		<div :key="count" class="v-tabs-overflow__stage" :style="{ width }">
			<Tabs
				v-model="current"
				:type="type"
				:stepper="stepper === 'true'"
				closable
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
					{{ item.label }}的内容
				</TabsPane>
			</Tabs>
		</div>
		<p>当前值：{{ current }}。可用滚轮、触控板或两端箭头浏览；切换选中项时会滚入可视区。</p>
	</div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { Tabs, TabsPane } from '..';
import { Select } from '../../select';
import { Button } from '../../button';

const TYPES = ['line', 'card', 'button', 'capsule', 'text', 'round'].map(value => ({ value, label: value }));
const COUNTS = [5, 20, 60].map(value => ({ value, label: `${value} 项` }));
const WIDTHS = ['100%', '600px', '360px'].map(value => ({ value, label: value }));
const STEPPERS = ['true', 'false'].map(value => ({ value, label: value }));

let uid = 0;
const createItems = n => Array.from({ length: n }, (_, i) => {
	uid++;
	return {
		value: `item-${uid}`,
		// 长短不一的标签
		label: i % 4 === 2 ? `较长的条目 ${uid}` : `条目 ${uid}`,
		disabled: i % 9 === 4
	};
});

const count = ref(20);
const type = ref('line');
const width = ref('100%');
const stepper = ref('true');
const items = ref([]);
const current = ref();

watch(count, (n) => {
	items.value = createItems(n);
	// 默认选中末项，挂载时应直接定位到末尾
	current.value = items.value[n - 1].value;
}, { immediate: true });

const handleAdd = () => {
	const [item] = createItems(1);
	items.value.push(item);
	current.value = item.value;
};

const handleRemove = (value, index) => {
	items.value.splice(index, 1);
	if (current.value === value) {
		current.value = items.value[Math.max(0, index - 1)]?.value;
	}
};

const handleRemoveCurrent = () => {
	const index = items.value.findIndex(item => item.value === current.value);
	index !== -1 && handleRemove(current.value, index);
};
</script>

<style scoped>
.v-tabs-overflow {
	padding: 20px;
}

.v-tabs-overflow__controls {
	display: flex;
	flex-wrap: wrap;
	gap: 12px;
	margin-bottom: 16px;
}

.v-tabs-overflow__controls .vc-select {
	width: 180px;
}

.v-tabs-overflow__stage {
	max-width: 100%;
	padding: 12px;
	border: 1px dashed var(--vc-color-neutral-light);
	box-sizing: border-box;
}
</style>
