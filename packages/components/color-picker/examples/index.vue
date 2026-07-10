<template>
	<div class="v-color-picker-example">
		<section>
			<h4>基础用法</h4>
			<div class="v-color-picker-example__row">
				<ColorPicker v-model="color" />
				<span>{{ color || '未选择' }}</span>
			</div>
		</section>

		<section>
			<h4>透明度</h4>
			<div class="v-color-picker-example__row">
				<ColorPicker v-model="alphaColor" alpha />
				<span>{{ alphaColor }}</span>
			</div>
		</section>

		<section>
			<h4>预设颜色</h4>
			<div class="v-color-picker-example__row">
				<ColorPicker
					v-model="presetColor"
					alpha
					recommend
					:colors="predefine"
				/>
				<span>{{ presetColor }}</span>
			</div>
		</section>

		<section>
			<h4>尺寸</h4>
			<div class="v-color-picker-example__row">
				<ColorPicker v-model="sizeColor" size="small" />
				<ColorPicker v-model="sizeColor" />
				<ColorPicker v-model="sizeColor" size="large" />
			</div>
		</section>
	</div>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import { ColorPicker } from '..';

const color = ref('#1DB88C');
const alphaColor = ref('rgba(19, 206, 102, 0.8)');
const presetColor = ref('hsva(180, 65%, 20%, 0.5)');
const sizeColor = ref('#5495F6');
const predefine = ref([
	'#FF4500',
	'#FF8C00',
	'#FFD700',
	'#90EE90',
	'#00CED1',
	'#1E90FF',
	'#C71585',
	'rgba(255, 69, 0, 0.68)',
	'rgb(255, 120, 0)',
	'hsv(51, 100%, 98%)',
	'hsva(120, 40%, 94%, 0.5)',
	'hsl(181, 100%, 37%)',
	'hsla(209, 100%, 56%, 0.73)'
]);
</script>
<style lang="scss">
.v-color-picker-example {
	display: grid;
	gap: 20px;
	padding: 20px;

	h4 {
		margin: 0 0 10px;
		font-weight: 500;
	}

	.v-color-picker-example__row {
		display: flex;
		gap: 12px;
		align-items: center;
	}
}
</style>
