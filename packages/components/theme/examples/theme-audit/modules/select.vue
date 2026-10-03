<template>
	<div class="audit-stack">
		<div v-for="(item, index) in states" :key="index" class="audit-sample" :data-state="item.label">
			<div class="audit-sample__label">{{ item.label }}</div>
			<Select :key="`${index}-${generation}`" v-model="item.value"
				:data="options" :disabled="item.disabled" :max="item.max" clearable searchable />
		</div>
		<p class="audit-hint">打开菜单检查普通 / 选中 / 禁用与 hover，输入不匹配关键词检查空状态。</p>
	</div>
</template>
<script setup>
import { reactive, ref, watch } from 'vue';
import { Select } from '@deot/vc';

const props = defineProps({ mobile: Boolean, overlayGeneration: Number });
const options = [
	{ value: 'a', label: '普通选项' }, { value: 'b', label: '选中选项' },
	{ value: 'c', label: '禁用选项', disabled: true }
];
const states = reactive([
	...[false, true].flatMap(disabled => [1, 99].map(max => ({
		label: `${max === 1 ? '单选' : '多选'}${disabled ? ' · 禁用' : ' · 可搜索'}`,
		value: max === 1 ? 'b' : ['a', 'b'], disabled, max
	}))),
	{ label: '空值与搜索无结果', value: '', disabled: false, max: 1 }
]);
const generation = ref(0);
watch(() => props.overlayGeneration, () => { generation.value++; });
</script>
