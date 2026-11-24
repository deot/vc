<template>
	<div class="vc-time-picker-plaintext-demo">
		<Button @click="plaintext = !plaintext">
			plaintext: {{ plaintext }}
		</Button>

		<div class="vc-time-picker-plaintext-demo__row">
			<span class="vc-time-picker-plaintext-demo__label">time</span>
			<TimePicker v-model="time" :plaintext="plaintext" style="width: 160px" />
		</div>
		<div class="vc-time-picker-plaintext-demo__row">
			<span class="vc-time-picker-plaintext-demo__label">timerange</span>
			<TimePicker v-model="range" type="timerange" format="HH:mm" :plaintext="plaintext" style="width: 240px" />
		</div>
		<div class="vc-time-picker-plaintext-demo__row">
			<span class="vc-time-picker-plaintext-demo__label">空值 + extra</span>
			<TimePicker v-model="empty" :plaintext="plaintext" extra="-" style="width: 160px" />
		</div>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { TimePicker } from '..';
import { Button } from '../../button';

const plaintext = ref(true);
const time = ref('08:30:00');
const range = ref(['09:00', '18:00']);
const empty = ref('');
</script>

<style lang="scss">
.vc-time-picker-plaintext-demo {
	margin: 40px;

	&__row {
		display: flex;
		margin: 16px 0;
		align-items: center;
		gap: 16px;
	}

	&__label {
		width: 120px;
		color: #999;
	}
}
</style>
