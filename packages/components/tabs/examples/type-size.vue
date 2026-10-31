<template>
	<div class="v-tabs-type-size">
		<div class="v-tabs-type-size__controls">
			<Select v-model="size" :data="SIZES" label="size" />
			<Select v-model="closable" :data="CLOSABLES" label="closable" />
		</div>
		<div class="v-tabs-type-size__stage">
			<div v-for="type in TYPES" :key="type" class="v-tabs-type-size__row">
				<span class="v-tabs-type-size__name">{{ type }}</span>
				<div class="v-tabs-type-size__group">
					<Tabs
						v-model="current"
						:type="type"
						:size="size"
						:closable="closable === 'true'"
						@tab-remove="handleRemove"
					>
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
					<!-- 选中项被禁用 -->
					<Tabs model-value="b" :type="type" :size="size">
						<TabsPane value="a" label="选项 A" />
						<TabsPane value="b" label="选项 B" disabled />
						<TabsPane value="c" label="选项 C" />
					</Tabs>
				</div>
			</div>
		</div>
		<p>当前值：{{ current }}；已关闭：{{ removed.join('、') || '无' }}</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Tabs, TabsPane } from '..';
import { Select } from '../../select';

const TYPES = ['line', 'card', 'button', 'capsule', 'text', 'round'];
const SIZES = ['mini', 'small', 'medium', 'large'].map(value => ({ value, label: value }));
// Select 的值为字符串，使用时转为布尔值
const CLOSABLES = [
	{ value: 'false', label: '否' },
	{ value: 'true', label: '是' }
];
const OPTIONS = [
	{ value: 'a', label: '选项 A' },
	{ value: 'b', label: '选项 B' },
	{ value: 'c', label: '较长的选项 C' },
	{ value: 'd', label: '选项 D', disabled: true }
];

const size = ref('medium');
const closable = ref('false');
const current = ref('b');
const items = ref(OPTIONS.slice());
const removed = ref([]);

const handleRemove = (value, index) => {
	const [item] = items.value.splice(index, 1);
	removed.value.push(item.label);
	if (current.value === value) {
		current.value = items.value[Math.max(0, index - 1)]?.value;
	}
	// 全部关闭后恢复，便于继续查看
	if (!items.value.length) {
		items.value = OPTIONS.slice();
		removed.value = [];
		current.value = 'b';
	}
};
</script>

<style scoped>
.v-tabs-type-size {
	padding: 20px;
}

.v-tabs-type-size__controls {
	display: flex;
	gap: 12px;
	margin-bottom: 16px;
}

.v-tabs-type-size__stage {
	display: grid;
	gap: 16px;
}

.v-tabs-type-size__row {
	display: flex;
	align-items: flex-start;
	gap: 24px;
}

.v-tabs-type-size__name {
	width: 96px;
	line-height: 32px;
	flex-shrink: 0;
}

.v-tabs-type-size__group {
	display: grid;
	min-width: 0;
	flex: 1;
	gap: 8px;
}
</style>
