<template>
	<div class="vc-color-picker-plaintext-demo">
		<Button @click="plaintext = !plaintext">
			plaintext: {{ plaintext }}
		</Button>

		<div class="vc-color-picker-plaintext-demo__row">
			<span class="vc-color-picker-plaintext-demo__label">hex</span>
			<ColorPicker v-model="hex" :plaintext="plaintext" />
		</div>
		<div class="vc-color-picker-plaintext-demo__row">
			<span class="vc-color-picker-plaintext-demo__label">rgba</span>
			<ColorPicker v-model="rgba" alpha format="rgb" :plaintext="plaintext" />
		</div>
		<div class="vc-color-picker-plaintext-demo__row">
			<span class="vc-color-picker-plaintext-demo__label">空值 + extra</span>
			<ColorPicker v-model="empty" :plaintext="plaintext" extra="-" />
		</div>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { ColorPicker } from '..';
import { Button } from '../../button';

const plaintext = ref(true);
const hex = ref('#5495F6');
const rgba = ref('rgba(84, 149, 246, 0.5)');
const empty = ref('');
</script>

<style lang="scss">
.vc-color-picker-plaintext-demo {
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
