<template>
	<div class="audit-stack">
		<div v-for="(item, index) in states" :key="index" class="audit-sample" :data-state="item.label">
			<div class="audit-sample__label">{{ item.label }}</div>
			<Cascader :key="`${index}-${generation}`" v-model="item.value" :data="branches" clearable :disabled="item.disabled" />
		</div>
	</div>
</template>
<script setup>
import { reactive, ref, watch } from 'vue';
import { Cascader } from '@deot/vc';

const props = defineProps({ mobile: Boolean, overlayGeneration: Number });
const options = [
	{ value: 'a', label: '普通选项' }, { value: 'b', label: '选中选项' },
	{ value: 'c', label: '禁用选项', disabled: true }
];
const branches = [
	{ value: 'group-a', label: '分组 A', children: options },
	{ value: 'group-b', label: '分组 B', children: [{ value: 'd', label: '叶子 D' }, { value: 'e', label: '叶子 E' }] }
];
const states = reactive([
	{ label: '级联选中：hover 展开列', value: ['group-a', 'b'], disabled: false },
	{ label: '禁用', value: ['group-a', 'b'], disabled: true },
	{ label: '空值', value: [], disabled: false }
]);
const generation = ref(0);
watch(() => props.overlayGeneration, () => { generation.value++; });
</script>
