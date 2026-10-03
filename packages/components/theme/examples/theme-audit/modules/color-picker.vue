<template>
	<div class="audit-stack">
		<div class="audit-sample" data-state="空值 / 有值 / 禁用 / 透明色">
			<div class="audit-sample__label">空值 / 有值 / 禁用 / 透明色</div>
			<div class="audit-row">
				<ColorPicker v-for="(item, index) in pickers" :key="index" v-model="item.value" :disabled="index === 2" alpha format="rgb" />
			</div>
		</div>
		<div class="audit-sample" data-state="完整面板：滑块、棋盘格和确认区">
			<div class="audit-sample__label">完整面板：滑块、棋盘格和确认区</div>
			<ColorPickerView v-model="panel" alpha format="rgb" recommend />
		</div>
	</div>
</template>
<script setup>
import { reactive, ref } from 'vue';
import { ColorPicker, ColorPickerView } from '@deot/vc';

defineProps({ mobile: Boolean, overlayGeneration: Number });
const pickers = reactive(['', '#456CF6', '#456CF6', 'rgba(69, 108, 246, 0.4)'].map(value => ({ value })));
const panel = ref('rgba(69, 108, 246, 0.6)');
</script>
