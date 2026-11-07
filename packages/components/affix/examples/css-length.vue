<template>
	<div class="affix-css-length" :style="{ '--header-height': `${height}px` }">
		<div class="affix-css-length__header">
			顶部栏 {{ height }}px
			<Button size="small" @click="height = height === 48 ? 80 : 48">
				切换高度
			</Button>
		</div>
		<p>offset="var(--header-height)"：顶部栏变高后，吸附位置和吸附判断随之变化，不需要改 offset</p>
		<p v-for="i in 6" :key="`a${i}`">
			{{ i }}
		</p>
		<Affix v-model="active" offset="var(--header-height)">
			<Button type="primary">
				吸附在顶部栏下方{{ active ? '（吸附中）' : '' }}
			</Button>
		</Affix>
		<p v-for="i in 60" :key="`b${i}`">
			{{ i }}
		</p>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Button } from '../../button';
import { Affix } from '..';

const height = ref(48);
const active = ref(false);
</script>
<style>
.affix-css-length__header {
	position: fixed;
	top: 0;
	right: 0;
	left: 0;
	z-index: 2;
	display: flex;
	height: var(--header-height);
	padding: 0 16px;
	color: var(--vc-color-contrast-light);
	background: var(--vc-color-dark-light);
	align-items: center;
	gap: 12px;
}

.affix-css-length {
	padding-top: var(--header-height);
}
</style>
