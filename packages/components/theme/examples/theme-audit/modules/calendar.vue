<template>
	<div class="audit-stack audit-calendar">
		<div class="audit-row">
			<Button @click="calendar?.prev()">上个月</Button>
			<Button @click="calendar?.next()">下个月</Button>
		</div>
		<Calendar ref="calendar" show-adjacent-weeks />
		<div class="audit-sample" data-state="自定义选中 / 禁用日（业务内容通过主题变量配置）">
			<div class="audit-sample__label">自定义选中 / 禁用日（业务内容通过主题变量配置）</div>
			<Calendar show-adjacent-weeks>
				<template #default="{ cell, today }">
					<span
						class="audit-calendar__date"
						:class="{ 'is-selected': cell.value === (selected ?? today), 'is-disabled': cell.date % 7 === 0 }"
						@click="handleSelect(cell)"
					>{{ cell.date }}</span>
				</template>
			</Calendar>
		</div>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Calendar, Button } from '@deot/vc';

defineProps({ mobile: Boolean, overlayGeneration: Number });
const calendar = ref();
const selected = ref();
const handleSelect = (cell) => { if (cell.date % 7 !== 0) selected.value = cell.value; };
</script>
