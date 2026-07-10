<template>
	<div class="v-slider-example">
		<section>
			<h3>Basic</h3>
			<Slider v-model="value1" />
			<Slider
				v-model="value2"
				range
			/>
			<Slider
				v-model="value3"
				range
				disabled
			/>
		</section>

		<section>
			<h3>Step</h3>
			<Slider
				v-model="value4"
				:step="10"
			/>
			<Slider
				v-model="value5"
				:step="10"
				range
				show-stops
			/>
		</section>

		<section>
			<h3>Input</h3>
			<Slider
				v-model="value6"
				show-input
			/>
		</section>

		<section>
			<h3>Formatter</h3>
			<Slider
				v-model="value7"
				:formatter="formatTip"
				show-tip="always"
			/>
			<Slider
				v-model="value8"
				:formatter="hideTip"
			/>
		</section>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Slider } from '..';

const value1 = ref(20);
const value2 = ref([20, 60]);
const value3 = ref([20, 60]);
const value4 = ref(30);
const value5 = ref([20, 80]);
const value6 = ref(20);
const value7 = ref(35);
const value8 = ref(35);

const formatTip = value => `Progress: ${value}%`;
const hideTip = () => null;
</script>
<style scoped>
.v-slider-example {
	padding: 24px;
}

.v-slider-example section {
	max-width: 520px;
	margin-bottom: 32px;
}

.v-slider-example h3 {
	margin: 0 0 16px;
	font-size: 16px;
	font-weight: 500;
}
</style>
