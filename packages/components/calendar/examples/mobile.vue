<template>
	<div class="m-calendar-example">
		<div class="m-calendar-example__tools">
			<MButton size="small" @click="kind = kinds[(kinds.indexOf(kind) + 1) % kinds.length]">
				{{ labels[kind] }}
			</MButton>
			<MButton size="small" @click="lunar = !lunar">
				农历：{{ lunar ? '开' : '关' }}
			</MButton>
		</div>
		<MCalendar
			:key="kind"
			v-model="value"
			:type="kind === 'daterange' ? 'daterange' : 'date'"
			:multiple="kind === 'multiple'"
			:lunar="lunar"
		>
			<template #content="{ value: day }">
				<span v-if="dots[day]" class="m-calendar-example__dot" />
			</template>
		</MCalendar>
		<p class="m-calendar-example__value">
			值：{{ value }}
		</p>

		<h3 class="m-calendar-example__title">
			MCalendarPickerView（弹层里的列表，单独使用）
		</h3>
		<div class="m-calendar-example__tools">
			<MButton size="small" @click="view?.scrollToDate(new Date())">
				回到本月
			</MButton>
			<a href="./mobile-picker.html" class="m-calendar-example__link">MCalendarPicker 示例</a>
		</div>
		<MCalendarPickerView
			ref="view"
			v-model="range"
			type="daterange"
			:lunar="lunar"
			class="m-calendar-example__view"
		/>
		<p class="m-calendar-example__value">
			区间：{{ range }}
		</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { MCalendar, MCalendarPickerView } from '../index.m';
import { MButton } from '../../button/index.m';

const kinds = ['date', 'daterange', 'multiple'];
const labels = { date: '单选', daterange: '区间', multiple: '多选' };
const kind = ref('date');
const value = ref('');
const lunar = ref(true);
const view = ref();
const range = ref([]);

const today = new Date();
const toKey = (offset) => {
	const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset);
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};
const dots = { [toKey(1)]: true, [toKey(3)]: true, [toKey(8)]: true };
</script>

<style scoped>
.m-calendar-example__title {
	padding: calc(var(--vc-rem) * 48) calc(var(--vc-rem) * 32) 0;
	font-size: calc(var(--vc-rem) * 28);
}

.m-calendar-example__link {
	align-self: center;
	font-size: calc(var(--vc-rem) * 24);
	color: var(--vc-color-primary);
}

.m-calendar-example__view {
	--vc-calendar-picker-height: calc(var(--vc-rem) * 800);
}

.m-calendar-example__tools {
	display: flex;
	gap: calc(var(--vc-rem) * 16);
	padding: calc(var(--vc-rem) * 24) calc(var(--vc-rem) * 32);
}

.m-calendar-example__dot {
	display: inline-block;
	width: calc(var(--vc-rem) * 8);
	height: calc(var(--vc-rem) * 8);
	background: var(--vc-color-primary);
	border-radius: 50%;
}

.m-calendar-example__value {
	padding: 0 calc(var(--vc-rem) * 32);
	font-size: calc(var(--vc-rem) * 24);
}
</style>
