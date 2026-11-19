<template>
	<div class="m-progress-demo">
		<h3>线形</h3>
		<MProgress :percent="percent" />
		<MProgress :percent="30" status="error" />
		<MProgress :percent="100" />
		<MProgress :percent="percent" :show-text="false" />
		<MProgress :percent="percent" :stroke-width="16" animated />

		<h3>文字在条内 / 插槽 / 置灰</h3>
		<MProgress :percent="percent" text-inside />
		<MProgress :percent="percent">
			<template #default="{ percent: value }">
				<span>{{ Math.round(value) }} / 100</span>
			</template>
		</MProgress>
		<MProgress :percent="percent" disabled />
		<MProgress :percent="percent" color="#ff5722" />

		<h3>圆形</h3>
		<div class="m-progress-demo__row">
			<MProgress :percent="percent" type="circle" />
			<MProgress :percent="100" type="circle" />
			<MProgress :percent="percent" type="circle" disabled />
			<MProgress :percent="percent" type="circle" :size="96" :show-text="false" />
		</div>

		<div class="m-progress-demo__row">
			<MButton size="small" @click="percent = Math.max(0, percent - 10)">减少</MButton>
			<MButton size="small" @click="percent = Math.min(100, percent + 10)">增加</MButton>
		</div>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { MProgress } from '../index.m';
import { MButton } from '../../button/index.m';

const percent = ref(60);
</script>
<style>
.m-progress-demo {
	display: grid;
	padding: 16px;
	gap: calc(var(--vc-rem) * 32);
}

.m-progress-demo h3 {
	margin: 0;
}

.m-progress-demo__row {
	display: flex;
	align-items: center;
	gap: calc(var(--vc-rem) * 32);
}
</style>
