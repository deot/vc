<template>
	<div class="audit-stack">
		<div v-for="(item, index) in states" :key="index" class="audit-sample" :data-state="item.label">
			<div class="audit-sample__label">{{ item.label }}</div>
			<component :is="mobile ? MInput : Input"
				v-model="item.value" :disabled="index === 2 || index === 3" :readonly="index === 4"
				placeholder="点击观察 focus" clearable :maxlength="80" :rows="3" />
		</div>
		<div class="audit-sample" data-state="前后缀 · 搜索 · 数字">
			<div class="audit-sample__label">前后缀 · 搜索 · 数字</div>
			<div class="audit-stack">
				<component :is="mobile ? MInput : Input" v-model="prefix" prepend="https://" append=".com" />
				<component :is="mobile ? MInputSearch : InputSearch" v-model="search" placeholder="搜索" />
				<div class="audit-row">
					<component :is="mobile ? MInputNumber : InputNumber" v-model="number" />
					<component :is="mobile ? MInputNumber : InputNumber" v-model="disabledNumber" disabled />
				</div>
			</div>
		</div>
		<p class="audit-hint">普通输入框可点击或 Tab 聚焦；禁用项不可交互。</p>
	</div>
</template>
<script setup>
import { reactive, ref } from 'vue';
import { Input, InputNumber, InputSearch, MInput, MInputNumber, MInputSearch } from '@deot/vc';

defineProps({ mobile: Boolean, overlayGeneration: Number });
const states = reactive(['空值', '有值', '禁用空值', '禁用有值', '只读'].map((label, index) => ({
	label, value: index === 0 || index === 2 ? '' : '主题参数实时生效'
})));
const prefix = ref('example');
const search = ref('');
const number = ref(4);
const disabledNumber = ref(4);
</script>
