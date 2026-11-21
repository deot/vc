<template>
	<div class="audit-stack audit-calendar">
		<div class="audit-sample" data-state="单选 / 今天 / 禁用（周末）">
			<div class="audit-sample__label">单选 / 今天 / 禁用（周末）</div>
			<component :is="mobile ? MCalendar : Calendar" v-model="single" :disabled-date="disabledDate" lunar />
		</div>
		<div class="audit-sample" data-state="区间">
			<div class="audit-sample__label">区间</div>
			<component :is="mobile ? MCalendar : Calendar" v-model="range" type="daterange" />
		</div>
		<div v-if="mobile" class="audit-sample" data-state="MCalendarPicker">
			<div class="audit-sample__label">MCalendarPicker</div>
			<MCalendarPicker v-model="single" label="单选" />
			<MCalendarPicker v-model="range" label="区间" type="daterange" lunar />
		</div>
		<div class="audit-sample" data-state="年视图">
			<div class="audit-sample__label">年视图</div>
			<component :is="mobile ? MCalendar : Calendar" v-model="single" mode="year" />
		</div>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Calendar, MCalendar, MCalendarPicker } from '@deot/vc';

defineProps({ mobile: Boolean, overlayGeneration: Number });

const pad = value => String(value).padStart(2, '0');
const now = new Date();
const key = day => `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(day)}`;
const single = ref(key(12));
const range = ref([key(8), key(18)]);
const disabledDate = date => date.getDay() === 0 || date.getDay() === 6;
</script>
