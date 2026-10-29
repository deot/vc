<template>
	<div class="grid-example">
		<p>getSpan 写法同 Table：返回 [rowspan, colspan] 或 { rowspan, colspan }；colspan 覆盖该项的 span，rowspan 跨多行，任一为 0 时隐藏该项。后面的项会跳过被占用的格子</p>
		<div class="grid-example__controls">
			<Select v-model="mode" :data="MODES" label="合并方式" />
		</div>

		<Grid :columns="24" :gap="8" :get-span="getSpan">
			<GridItem v-for="i in 8" :key="i" :span="6">
				<div class="cell">
					条目 {{ i }}
				</div>
			</GridItem>
		</Grid>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Select } from '../../select';
import { Grid, GridItem } from '..';

const MODES = [
	{ value: 'rowspan', label: '第 1 项跨 2 行' },
	{ value: 'colspan', label: '第 2 项 colspan 12' },
	{ value: 'both', label: '第 1 项 [2, 12]' },
	{ value: 'hidden', label: '第 3 项返回 0（隐藏）' },
	{ value: 'none', label: '不合并' }
];
const mode = ref(MODES[0].value);

const getSpan = ({ index }) => {
	switch (mode.value) {
		case 'rowspan':
			return index === 0 ? [2, 6] : void 0;
		case 'colspan':
			return index === 1 ? { colspan: 12 } : void 0;
		case 'both':
			return index === 0 ? [2, 12] : void 0;
		case 'hidden':
			return index === 2 ? [0, 0] : void 0;
		default:
			return void 0;
	}
};
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

.cell {
	display: flex;
	height: 100%;
	min-height: 40px;
	color: var(--vc-color-dark-light);
	background: var(--vc-background-color-light);
	border-radius: 4px;
	align-items: center;
	justify-content: center;
}
</style>
