<template>
	<div class="v-slider-range">
		<section>
			<h3>Multiple</h3>
			<div>值：{{ value1.join(' / ') }}</div>
			<Slider v-model="value1" range />
		</section>

		<section>
			<h3>Draggable bar</h3>
			<div>值：{{ value4.join(' – ') }}；按住选中条整体平移，未移动时按点击处理</div>
			<Slider v-model="value4" :range="{ draggable: true }" :step="5" ticks="line" />
		</section>

		<section>
			<h3>Input</h3>
			<div>值：{{ value5.join(' – ') }}；两个滑块的范围显示两个输入框</div>
			<Slider v-model="value5" range show-input />
		</section>

		<section>
			<h3>Keyboard</h3>
			<div>值：{{ value6 }}；聚焦滑块后 ← → ↑ ↓ 移动一步，PageUp / PageDown 十步，Home / End 到边界</div>
			<Slider v-model="value6" :step="2" />
		</section>

		<section>
			<h3>Segments</h3>
			<div>值：{{ value2 }}（0–10 占一半宽度、步长 1；10–50 步长 8；50–100 步长 25）</div>
			<Slider
				v-model="value2"
				:segments="segments"
				ticks="dot"
			/>
		</section>

		<section>
			<h3>Step null</h3>
			<div>值：{{ value3 }}（只能落在 0 / 15 / 40 / 100）</div>
			<Slider
				v-model="value3"
				:step="null"
				:marks="marks"
				ticks="dot"
			/>
		</section>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Slider } from '..';

const value1 = ref([10, 30, 60, 90]);
const value2 = ref(10);
const value3 = ref(15);
const value4 = ref([20, 45]);
const value5 = ref([20, 60]);
const value6 = ref(40);

const segments = [
	{ end: 10, width: '50%' },
	{ end: 50, step: 8 },
	{ end: 100, step: 25 }
];
const marks = { 0: '0', 15: '15', 40: '40', 100: '100' };
</script>
<style scoped>
.v-slider-range {
	padding: 24px;
}

.v-slider-range section {
	display: grid;
	max-width: 520px;
	margin-bottom: 32px;
	gap: 8px;
}

.v-slider-range h3 {
	margin: 0 0 8px;
	font-size: 16px;
	font-weight: 500;
}
</style>
