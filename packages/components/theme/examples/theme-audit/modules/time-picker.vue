<template>
	<div class="audit-stack">
		<div v-for="item in states" :key="item.type" class="audit-sample" :data-state="item.type">
			<div class="audit-sample__label">{{ item.type }}</div>
			<TimePicker :key="`${item.type}-${generation}`" v-model="item.value" :type="item.type" :disabled-hours="[0, 1, 2]" />
		</div>
		<div class="audit-sample" data-state="禁用">
			<div class="audit-sample__label">禁用</div>
			<TimePicker model-value="12:30:00" disabled />
		</div>
	</div>
</template>
<script setup>
import { reactive, ref, watch } from 'vue';
import { TimePicker } from '@deot/vc';

const props = defineProps({ mobile: Boolean, overlayGeneration: Number });
const states = reactive([
	{ type: 'time', value: '12:30:00' }, { type: 'timerange', value: ['09:00:00', '18:00:00'] }
]);
const generation = ref(0);
watch(() => props.overlayGeneration, () => { generation.value++; });
</script>
