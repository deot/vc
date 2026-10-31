<template>
	<div class="v-slider-marks">
		<section>
			<h3>Marks</h3>
			<div>值：{{ value1 }}；点击标签跳到对应值，标签可单独设置 class / style</div>
			<Slider v-model="value1" :marks="marks" ticks="line" :step="5" />
		</section>

		<section>
			<h3>Step null</h3>
			<div>值：{{ value2.join(' – ') }}；只能落在标签上</div>
			<Slider v-model="value2" :marks="marks" :step="null" range />
		</section>

		<section>
			<h3>Segments + marks</h3>
			<div>值：{{ value3 }}；0–20 占 60% 宽度、步长 1，20–100 步长 20</div>
			<Slider
				v-model="value3"
				:marks="segmentMarks"
				:segments="segments"
				ticks="dot"
			/>
		</section>

		<section>
			<h3>Vertical</h3>
			<div class="v-slider-marks__vertical">
				<Slider v-model="value4" :marks="marks" vertical ticks="line" :step="5" />
				<Slider v-model="value5" :marks="marks" vertical inverted range />
			</div>
		</section>

		<section>
			<h3>Slots</h3>
			<div>#thumb 自定义滑块，#mark 自定义标签，#tooltip 自定义提示</div>
			<Slider v-model="value6" :marks="marks" range>
				<template #thumb="{ value, dragging }">
					<span :class="['v-slider-marks__thumb', { 'is-dragging': dragging }]">{{ value }}</span>
				</template>
				<template #mark="{ label, active }">
					<span :style="{ fontWeight: active ? 600 : 400 }">{{ label }}</span>
				</template>
				<template #tooltip="{ index }">
					{{ index === 0 ? 'Start' : 'End' }}
				</template>
			</Slider>
		</section>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Slider } from '..';

const value1 = ref(35);
const value2 = ref([25, 75]);
const value3 = ref(10);
const value4 = ref(40);
const value5 = ref([25, 50]);
const value6 = ref([25, 75]);

const marks = {
	0: '0',
	25: '25',
	50: { label: '50', style: { color: 'var(--vc-color-primary)' } },
	75: '75',
	100: '100'
};
const segmentMarks = { 0: '0', 10: '10', 20: '20', 60: '60', 100: '100' };
const segments = [
	{ end: 20, width: '60%' },
	{ end: 100, step: 20 }
];
</script>
<style scoped>
.v-slider-marks {
	padding: 24px;
}

.v-slider-marks section {
	display: grid;
	max-width: 520px;
	margin-bottom: 32px;
	gap: 8px;
}

.v-slider-marks h3 {
	margin: 0 0 8px;
	font-size: 16px;
	font-weight: 500;
}

.v-slider-marks__vertical {
	display: flex;
	gap: 80px;
}

.v-slider-marks__thumb {
	display: inline-block;
	min-width: 28px;
	padding: 2px 6px;
	font-size: 12px;
	line-height: 16px;
	color: var(--vc-color-contrast-light);
	text-align: center;
	cursor: grab;
	background-color: var(--vc-color-primary);
	border-radius: 10px;
	box-sizing: border-box;
}

.v-slider-marks__thumb.is-dragging {
	cursor: grabbing;
}
</style>
