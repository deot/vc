<template>
	<div class="grid-example">
		<p>justify / align 控制每项在自己格子内的对齐；GridItem 上的同名属性覆盖单项（第 2 项固定为 justify="end"）。justifyContent 在轨道没有占满宽度时分布轨道（这里每列固定 120px）</p>
		<div class="grid-example__controls">
			<Select
				v-for="item in CONTROLS"
				:key="item.key"
				v-model="controls[item.key]"
				:data="item.data"
				:label="item.label"
			/>
		</div>

		<h4>justify / align</h4>
		<Grid :columns="3" :gap="8" :justify="controls.justify" :align="controls.align" class="board">
			<GridItem :span="1">
				<div class="cell">条目 1</div>
			</GridItem>
			<GridItem :span="1" justify="end">
				<div class="cell is-tall">条目 2</div>
			</GridItem>
			<GridItem :span="1">
				<div class="cell">条目 3</div>
			</GridItem>
		</Grid>

		<h4>justifyContent</h4>
		<Grid :columns="[120, 120, 120]" :gap="8" :justify-content="controls.justifyContent" class="board">
			<GridItem v-for="i in 3" :key="i" :span="1">
				<div class="cell">120px</div>
			</GridItem>
		</Grid>
	</div>
</template>
<script setup>
import { reactive } from 'vue';
import { Select } from '../../select';
import { Grid, GridItem } from '..';

const options = values => values.map(value => ({ value, label: value }));
const CONTROLS = [
	{ key: 'justify', label: 'justify', data: options(['start', 'center', 'end', 'stretch']) },
	{ key: 'align', label: 'align', data: options(['start', 'center', 'end', 'stretch', 'baseline']) },
	{ key: 'justifyContent', label: 'justifyContent', data: options(['start', 'center', 'end', 'space-between', 'space-around', 'space-evenly']) }
];
const controls = reactive(Object.fromEntries(CONTROLS.map(({ key, data }) => [key, data[0].value])));
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
	width: 260px;
}

.board {
	padding: 8px;
	border: 1px dashed var(--vc-border-color);
	border-radius: 4px;
}

.cell {
	height: 40px;
	min-width: 80px;
	padding: 0 12px;
	line-height: 40px;
	color: var(--vc-color-dark-light);
	text-align: center;
	background: var(--vc-background-color-light);
	border-radius: 4px;
}

.cell.is-tall {
	height: 80px;
}
</style>
