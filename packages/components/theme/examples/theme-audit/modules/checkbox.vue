<template>
	<div class="audit-stack">
		<div v-for="(group, index) in groups" :key="index" class="audit-sample" :data-state="group.disabled ? '禁用' : '可交互'">
			<div class="audit-sample__label">{{ group.disabled ? '禁用' : '可交互' }}</div>
			<div class="audit-row">
				<component :is="mobile ? MCheckbox : Checkbox"
					v-for="(item, state) in group.items" :key="state" v-model="item.value"
					:disabled="group.disabled" :indeterminate="item.indeterminate">
					{{ item.label }}
				</component>
			</div>
		</div>
	</div>
</template>
<script setup>
import { reactive } from 'vue';
import { Checkbox, MCheckbox } from '@deot/vc';

defineProps({ mobile: Boolean, overlayGeneration: Number });
const groups = reactive([false, true].map(disabled => ({
	disabled, items: [
		{ label: '未选中', value: false }, { label: '选中', value: true },
		{ label: '半选', value: false, indeterminate: true }
	]
})));
</script>
