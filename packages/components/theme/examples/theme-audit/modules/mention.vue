<template>
	<div class="audit-stack">
		<div v-for="(item, index) in states" :key="index" class="audit-sample" :data-state="item.label">
			<div class="audit-sample__label">{{ item.label }}</div>
			<component
				:is="mobile ? MMention : Mention" :key="`${index}-${generation}`" v-model="item.value"
				:data="options" :disabled="item.disabled" :rows="2" placeholder="输入 @ 查看联想"
			/>
		</div>
		<p class="audit-hint">在文字末尾输入 @ 打开联想，检查弹层位置、高亮行与禁用项；移动端为同样的下拉（750 稿）。</p>
	</div>
</template>
<script setup>
import { reactive, ref, watch } from 'vue';
import { Mention, MMention } from '@deot/vc';

const props = defineProps({ mobile: Boolean, overlayGeneration: Number });
const options = [{ value: '成员甲' }, { value: '成员乙' }, { value: '禁用成员', disabled: true }];
const states = reactive([
	{ label: '空值', value: '', disabled: false },
	{ label: '有值', value: '你好 @成员甲 ', disabled: false },
	{ label: '禁用', value: '你好 @成员甲 ', disabled: true }
]);
const generation = ref(0);
watch(() => props.overlayGeneration, () => { generation.value++; });
</script>
