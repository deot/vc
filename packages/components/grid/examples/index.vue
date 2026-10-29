<template>
	<div class="grid-example">
		<p>默认 24 列。span 为跨越的轨道数，offset 在左侧空出轨道，span="auto" 占满本行剩余；放不下时换行</p>
		<div class="grid-example__controls">
			<Select
				v-for="item in CONTROLS"
				:key="item.key"
				v-model="controls[item.key]"
				:data="item.data"
				:label="item.label"
			/>
		</div>

		<h4>span</h4>
		<Grid :gap="gap">
			<GridItem v-for="i in 3" :key="i" :span="8">
				<div class="cell">span 8</div>
			</GridItem>
			<GridItem :span="12">
				<div class="cell">span 12</div>
			</GridItem>
			<GridItem :span="6">
				<div class="cell">span 6</div>
			</GridItem>
			<GridItem :span="6">
				<div class="cell">span 6</div>
			</GridItem>
			<GridItem :span="24">
				<div class="cell">span 24</div>
			</GridItem>
		</Grid>

		<h4>offset</h4>
		<Grid :gap="gap">
			<GridItem :span="8">
				<div class="cell">span 8</div>
			</GridItem>
			<GridItem :span="8" :offset="8">
				<div class="cell">span 8 · offset 8</div>
			</GridItem>
			<GridItem :span="6" :offset="6">
				<div class="cell">span 6 · offset 6</div>
			</GridItem>
			<GridItem :span="6" :offset="6">
				<div class="cell">span 6 · offset 6</div>
			</GridItem>
		</Grid>

		<h4>span="auto"</h4>
		<Grid :gap="gap">
			<GridItem :span="6">
				<div class="cell">span 6</div>
			</GridItem>
			<GridItem span="auto">
				<div class="cell">auto（18）</div>
			</GridItem>
			<GridItem :span="4">
				<div class="cell">span 4</div>
			</GridItem>
			<GridItem :span="4">
				<div class="cell">span 4</div>
			</GridItem>
			<GridItem span="auto">
				<div class="cell">auto（16）</div>
			</GridItem>
		</Grid>
	</div>
</template>
<script setup>
import { computed, reactive } from 'vue';
import { Select } from '../../select';
import { Grid, GridItem } from '..';

const CONTROLS = [
	{ key: 'x', label: '水平间距', data: [8, 0, 16].map(value => ({ value, label: `${value}px` })) },
	{ key: 'y', label: '垂直间距', data: [8, 0, 16].map(value => ({ value, label: `${value}px` })) }
];
const controls = reactive(Object.fromEntries(CONTROLS.map(({ key, data }) => [key, data[0].value])));
const gap = computed(() => [controls.x, controls.y]);
</script>
<style scoped>
.grid-example {
	padding: 20px;
}

.grid-example__controls {
	display: flex;
	flex-wrap: wrap;
	gap: 12px;
	margin-bottom: 12px;
}

.grid-example__controls .vc-select {
	width: 200px;
}

.cell {
	height: 40px;
	line-height: 40px;
	color: var(--vc-color-dark-light);
	text-align: center;
	background: var(--vc-background-color-light);
	border-radius: 4px;
}
</style>
