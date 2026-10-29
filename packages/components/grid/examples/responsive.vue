<template>
	<div class="grid-example">
		<p>
			columns / gap / span / offset 都可以写成 { xs, sm, md, lg, xl, xxl }，按 Grid 自身的宽度取值
			（xs &lt;576、sm ≥576、md ≥768、lg ≥992、xl ≥1200、xxl ≥1600），放在弹窗或侧栏里也能取到正确的断点
		</p>
		<div class="grid-example__controls">
			<Select v-model="width" :data="WIDTHS" label="容器宽度" />
		</div>
		<code>:columns="{ xs: 1, sm: 2, md: 3, lg: 4, xl: 6 }"，第 1 项 :span="{ xs: 1, md: 2 }"</code>

		<div :style="{ width: width ? `${width}px` : '100%' }" class="frame">
			<Grid :columns="{ xs: 1, sm: 2, md: 3, lg: 4, xl: 6 }" :gap="{ xs: 8, lg: 16 }">
				<GridItem :span="{ xs: 1, md: 2 }">
					<div class="cell">条目 1</div>
				</GridItem>
				<GridItem v-for="i in 11" :key="i" :span="1">
					<div class="cell">条目 {{ i + 1 }}</div>
				</GridItem>
			</Grid>
		</div>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Select } from '../../select';
import { Grid, GridItem } from '..';

const WIDTHS = [
	{ value: 0, label: '100%' },
	...[360, 640, 900, 1100, 1300].map(value => ({ value, label: `${value}px` }))
];
const width = ref(WIDTHS[0].value);
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
	width: 240px;
}

code {
	display: block;
	margin-bottom: 12px;
	color: var(--vc-color-dark-lightest);
}

.frame {
	max-width: 100%;
	padding: 8px;
	border: 1px dashed var(--vc-border-color);
	border-radius: 4px;
	box-sizing: border-box;
	transition: width .2s;
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
