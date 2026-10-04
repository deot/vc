<template>
	<div class="audit-stack">
		<div class="audit-sample" data-state="选中区域 / 禁用项 / 上下分隔线">
			<div class="audit-sample__label">选中区域 / 禁用项 / 上下分隔线</div>
			<MPickerView :key="`view-${generation}`" v-model="view" :data="options" :columns="1" :cascader="false" />
		</div>
		<div class="audit-sample" data-state="打开标题与确认 / 取消弹层">
			<div class="audit-sample__label">打开标题与确认 / 取消弹层</div>
			<MPicker :key="`popup-${generation}`" v-model="popup" title="主题选择器" :data="options" label="选择项" :cascader="false" />
		</div>
	</div>
</template>
<script setup>
import { ref, watch } from 'vue';
import { MPicker, MPickerView } from '@deot/vc';

const props = defineProps({ mobile: Boolean, overlayGeneration: Number });
const options = [
	{ value: 'a', label: '普通选项' }, { value: 'b', label: '选中选项' },
	{ value: 'c', label: '禁用选项', disabled: true }
];
const view = ref(['b']);
const popup = ref(['b']);
const generation = ref(0);
watch(() => props.overlayGeneration, () => { generation.value++; });
</script>
