<template>
	<div class="audit-stack">
		<div v-for="item in states" :key="item.initial" class="audit-sample" :data-state="`评分 ${item.initial}`">
			<div class="audit-sample__label">评分 {{ item.initial }}</div>
			<Rate v-model="item.value" half :tooltip="['很差', '一般', '尚可', '满意', '很好']" />
		</div>
		<div class="audit-sample" data-state="只读">
			<div class="audit-sample__label">只读</div>
			<Rate :model-value="3.5" half disabled />
		</div>
		<div class="audit-sample" data-state="显式颜色对照（不跟随主题）">
			<div class="audit-sample__label">显式颜色对照（不跟随主题）</div>
			<Rate :model-value="4" color="#E6A23C" />
		</div>
	</div>
</template>
<script setup>
import { reactive } from 'vue';
import { Rate } from '@deot/vc';

defineProps({ mobile: Boolean, overlayGeneration: Number });
const states = reactive([0, 2.5, 4].map(initial => ({ initial, value: initial })));
</script>
