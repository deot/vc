<template>
	<div class="audit-stack">
		<div v-for="(group, index) in groups" :key="index" class="audit-sample" :data-state="group.disabled ? '禁用' : '可交互'">
			<div class="audit-sample__label">{{ group.disabled ? '禁用' : '可交互' }}</div>
			<div class="audit-row">
				<component :is="mobile ? MRadio : Radio"
					v-for="(item, state) in group.items" :key="state"
					v-model="item.value"
					:disabled="group.disabled">{{ item.label }}</component>
			</div>
		</div>
		<div class="audit-sample" data-state="分组">
			<div class="audit-sample__label">分组</div>
			<div class="audit-stack">
				<component :is="mobile ? MRadioGroup : RadioGroup" v-model="groupValue">
					<component :is="mobile ? MRadio : Radio"
						v-for="(value, index) in ['a', 'b', 'c']" :key="value"
						:value="value"
						:disabled="index === 2">{{ value }}</component>
				</component>
				<RadioGroup v-if="!mobile" v-model="buttonValue">
					<RadioButton v-for="(value, index) in ['a', 'b', 'c']" :key="value"
						:value="value" :disabled="index === 2">{{ value }}</RadioButton>
				</RadioGroup>
			</div>
		</div>
	</div>
</template>
<script setup>
import { reactive, ref } from 'vue';
import { Radio, RadioGroup, RadioButton, MRadio, MRadioGroup } from '@deot/vc';

defineProps({ mobile: Boolean, overlayGeneration: Number });
const groups = reactive([false, true].map(disabled => ({
	disabled, items: [{ label: '未选中', value: false }, { label: '选中', value: true }]
})));
const groupValue = ref('a');
const buttonValue = ref('a');
</script>
