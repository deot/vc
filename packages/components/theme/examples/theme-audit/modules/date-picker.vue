<template>
	<div class="audit-stack">
		<template v-if="mobile">
			<div v-for="item in mobileStates" :key="item.type" class="audit-sample" :data-state="item.type">
				<div class="audit-sample__label">{{ item.type }}</div>
				<MDatePicker :key="`${item.type}-${generation}`" v-model="item.value" :type="item.type" :label="item.type" />
			</div>
		</template>
		<template v-else>
			<div v-for="item in desktopStates" :key="item.type" class="audit-sample" :data-state="item.type">
				<div class="audit-sample__label">{{ item.type }}</div>
				<DatePicker :key="`${item.type}-${generation}`" v-model="item.value"
					:type="item.type" :disabled-date="disabledDate" :shortcuts="item.shortcuts" clearable />
			</div>
			<div class="audit-sample" data-state="禁用 / 空值">
				<div class="audit-sample__label">禁用 / 空值</div>
				<div class="audit-row">
					<DatePicker :key="`disabled-${generation}`" v-model="disabled" disabled />
					<DatePicker :key="`empty-${generation}`" v-model="empty" />
				</div>
			</div>
		</template>
	</div>
</template>
<script setup>
import { reactive, ref, watch } from 'vue';
import { DatePicker, MDatePicker } from '@deot/vc';

const props = defineProps({ mobile: Boolean, overlayGeneration: Number });
const now = new Date();
const year = now.getFullYear();
const mobileStates = reactive(['date', 'datetime', 'month', 'year'].map(type => ({ type, value: now })));
const desktopStates = reactive([
	'date', 'datetime', 'month', 'quarter', 'year', 'daterange', 'monthrange', 'quarterrange', 'datetimerange'
].map(type => ({
	type,
	value: type === 'quarter'
		? [`${year}-10-01`, `${year}-12-31`]
		: type === 'quarterrange'
			? [`${year}-01-01`, `${year}-12-31`]
			: type.includes('range') ? [new Date(year, now.getMonth(), 8), new Date(year, now.getMonth(), 18)] : now,
	shortcuts: [{
		text: '当前日期 / 区间',
		value: () => type.startsWith('quarter') ? [`${year}-10-01`, `${year}-12-31`] : type.includes('range') ? [now, now] : now
	}]
})));
const disabledDate = value => typeof value === 'number' ? value % 2 === 0 : value.getDay() === 0;
const disabled = ref(now);
const empty = ref('');
const generation = ref(0);
watch(() => props.overlayGeneration, () => { generation.value++; });
</script>
