<template>
	<div class="v-radio-type-size">
		<div class="v-radio-type-size__controls">
			<Select v-model="size" :data="SIZES" label="size" />
			<Select v-model="direction" :data="DIRECTIONS" label="排列" />
		</div>
		<div class="v-radio-type-size__stage">
			<div v-for="type in TYPES" :key="type" class="v-radio-type-size__row">
				<span class="v-radio-type-size__name">{{ type }}</span>
				<RadioGroup
					v-model="current"
					:type="type"
					:size="size"
					:vertical="direction === 'vertical'"
				>
					<Radio
						v-for="item in OPTIONS"
						:key="item.value"
						:value="item.value"
						:label="item.label"
						:disabled="item.disabled"
					/>
				</RadioGroup>
				<RadioGroup
					:model-value="'b'"
					:type="type"
					:size="size"
					:vertical="direction === 'vertical'"
					disabled
				>
					<Radio
						v-for="item in OPTIONS.slice(0, 3)"
						:key="item.value"
						:value="item.value"
						:label="item.label"
					/>
				</RadioGroup>
			</div>
			<div class="v-radio-type-size__row">
				<span class="v-radio-type-size__name">混用</span>
				<RadioGroup v-model="current" :size="size" :vertical="direction === 'vertical'">
					<RadioButton
						v-for="item in OPTIONS.slice(0, 3)"
						:key="item.value"
						:value="item.value"
						:label="item.label"
					/>
					<Radio value="d" label="选项 D" />
				</RadioGroup>
			</div>
			<div class="v-radio-type-size__row">
				<span class="v-radio-type-size__name">独立 Radio</span>
				<Radio v-model="single" :size="size" label="单独使用" />
			</div>
		</div>
		<p>当前值：{{ current }}</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Radio, RadioButton, RadioGroup } from '..';
import { Select } from '../../select';

const TYPES = ['default', 'button', 'card', 'capsule', 'text', 'round'];
const SIZES = ['mini', 'small', 'medium', 'large'].map(value => ({ value, label: value }));
const DIRECTIONS = [
	{ value: 'horizontal', label: '横向' },
	{ value: 'vertical', label: '纵向' }
];
const OPTIONS = [
	{ value: 'a', label: '选项 A' },
	{ value: 'b', label: '选项 B' },
	{ value: 'c', label: '较长的选项 C' },
	{ value: 'd', label: '选项 D', disabled: true }
];

const size = ref('medium');
const direction = ref('horizontal');
const current = ref('b');
const single = ref(false);
</script>

<style scoped>
.v-radio-type-size {
	padding: 20px;
}

.v-radio-type-size__controls {
	display: flex;
	gap: 12px;
	margin-bottom: 16px;
}

.v-radio-type-size__stage {
	display: grid;
	gap: 16px;
}

.v-radio-type-size__row {
	display: flex;
	align-items: flex-start;
	gap: 24px;
}

.v-radio-type-size__name {
	width: 96px;
	line-height: 32px;
	flex-shrink: 0;
}
</style>
