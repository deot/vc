<template>
	<div class="audit-stack">
		<div class="audit-sample" data-state="树：选中 / 禁用 / 勾选 / 展开 / 拖动">
			<div class="audit-sample__label">树：选中 / 禁用 / 勾选 / 展开 / 拖动</div>
			<Tree :key="`tree-${generation}`" v-model="checked"
				:data="branches" show-checkbox default-expand-all draggable highlight-current current-node-value="b" />
		</div>
		<div v-for="(item, index) in states" :key="index" class="audit-sample" :data-state="item.label">
			<div class="audit-sample__label">{{ item.label }}</div>
			<TreeSelect :key="`${index}-${generation}`" v-model="item.value"
				:data="branches" :cascader="item.cascader" :max="item.max" clearable searchable />
		</div>
	</div>
</template>
<script setup>
import { reactive, ref, watch } from 'vue';
import { Tree, TreeSelect } from '@deot/vc';

const props = defineProps({ mobile: Boolean, overlayGeneration: Number });
const branches = [
	{ value: 'group-a', label: '分组 A', children: [
		{ value: 'a', label: '普通选项' }, { value: 'b', label: '选中选项' },
		{ value: 'c', label: '禁用选项', disabled: true }
	] },
	{ value: 'group-b', label: '分组 B', children: [{ value: 'd', label: '叶子 D' }, { value: 'e', label: '叶子 E' }] }
];
const checked = ref(['b']);
const states = reactive([false, true].flatMap(cascader => [1, 99].map(max => ({
	label: `TreeSelect ${cascader ? '级联' : '树形'} · ${max === 1 ? '单选' : '多选'}`,
	value: max === 1 ? 'b' : ['a', 'b'], cascader, max
}))));
const generation = ref(0);
watch(() => props.overlayGeneration, () => { generation.value++; });
</script>
