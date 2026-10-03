<template>
	<div class="audit-stack">
		<div v-for="(item, index) in states" :key="index" class="audit-sample" :data-state="item.label">
			<div class="audit-sample__label">{{ item.label }}</div>
			<component
				:is="mobile ? MTextarea : Textarea" v-model="item.value" :disabled="index === 2 || index === 3"
				:readonly="index === 4" placeholder="点击观察 focus" clearable :maxlength="80" :rows="3"
			/>
		</div>
		<p class="audit-hint">普通输入框可点击或 Tab 聚焦；禁用项不可交互。</p>
	</div>
</template>
<script setup>
import { reactive } from 'vue';
import { Textarea, MTextarea } from '@deot/vc';

defineProps({ mobile: Boolean, overlayGeneration: Number });
const states = reactive(['空值', '有值', '禁用空值', '禁用有值', '只读'].map((label, index) => ({
	label, value: index === 0 || index === 2 ? '' : '主题参数实时生效'
})));
</script>
