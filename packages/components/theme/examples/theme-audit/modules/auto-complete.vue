<template>
	<div class="audit-stack">
		<div v-for="(item, index) in states" :key="index" class="audit-sample" :data-state="item.label">
			<div class="audit-sample__label">{{ item.label }}</div>
			<component
				:is="mobile ? MAutoComplete : AutoComplete" :key="`${index}-${generation}`" v-model="item.value"
				:data="options" :disabled="item.disabled" placeholder="聚焦查看联想项" clearable
			/>
		</div>
		<p class="audit-hint">聚焦打开联想，输入关键词检查高亮；方向键检查高亮行，禁用项不可选。</p>
	</div>
</template>
<script setup>
import { reactive, ref, watch } from 'vue';
import { AutoComplete, MAutoComplete } from '@deot/vc';

const props = defineProps({ mobile: Boolean, overlayGeneration: Number });
const options = [
	{ value: 'g1', label: '分组', children: [{ value: '普通联想项' }, { value: '另一项' }, { value: '禁用联想项', disabled: true }] }
];
const states = reactive([
	{ label: '空值', value: '', disabled: false },
	{ label: '有值', value: '普通', disabled: false },
	{ label: '禁用', value: '普通', disabled: true }
]);
const generation = ref(0);
watch(() => props.overlayGeneration, () => { generation.value++; });
</script>
