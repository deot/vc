<template>
	<div class="m-icon-demo">
		<h3>跟随外层字号</h3>
		<p class="m-icon-demo__text">
			<MIcon type="success" /> 文字与图标同一行
		</p>

		<h3>size（750 稿）</h3>
		<div class="m-icon-demo__row">
			<div v-for="item in items" :key="item.label" class="m-icon-demo__item">
				<MIcon type="success" :size="item.size" color="var(--vc-color-primary)" />
				<span>{{ item.label }}</span>
			</div>
		</div>

		<h3>color</h3>
		<div class="m-icon-demo__row">
			<MIcon type="success" :size="48" color="var(--vc-color-success)" />
			<MIcon type="warning" :size="48" color="var(--vc-color-warning)" />
			<MIcon type="error" :size="48" color="var(--vc-color-error)" />
		</div>
	</div>
</template>
<script setup>
import { MIcon } from '../index.m';

const items = [
	{ label: '32', size: 32 },
	{ label: '48', size: 48 },
	{ label: '[64, 32]', size: [64, 32] },
	{ label: '[[160, 48], 32]', size: [[160, 48], 32] }
];
</script>
<style scoped>
.m-icon-demo {
	padding: 16px;
}

.m-icon-demo__text {
	font-size: calc(var(--vc-rem) * 32);
}

.m-icon-demo__row {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 16px;
}

.m-icon-demo__item {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 4px;
	font-size: 12px;
}

.m-icon-demo__item > :first-child {
	outline: 1px dashed var(--vc-color-dark-extralight);
}
</style>
