<template>
	<div class="grid-example">
		<p>columns 为数组时，数字是固定 px、字符串原样使用；为字符串时就是完整的 grid-template-columns。span 按轨道数计算</p>
		<div class="grid-example__controls">
			<Select v-model="current" :data="TEMPLATES" label="columns" />
		</div>
		<code>{{ source }}</code>

		<Grid :columns="columns" :gap="[12, 8]">
			<GridItem v-for="(item, index) in items" :key="index" :span="item.span || 1">
				<div class="cell">
					{{ item.label }}
				</div>
			</GridItem>
		</Grid>
	</div>
</template>
<script setup>
import { computed, ref } from 'vue';
import { Select } from '../../select';
import { Grid, GridItem } from '..';

// 每个模板配一组示例项：前几项按轨道依次排开，最后一项跨整行
const TEMPLATES = [
	{
		value: 'fixed',
		label: '左侧固定 100px',
		columns: [100, '1fr'],
		items: [{ label: '100px' }, { label: '1fr' }, { label: '100px' }, { label: '1fr' }, { label: 'span 2', span: 2 }]
	},
	{
		value: 'mixed',
		label: '固定 + auto + minmax',
		columns: [160, 'auto', 'minmax(120px, 1fr)'],
		items: [{ label: '160px' }, { label: 'auto：按内容' }, { label: 'minmax(120px, 1fr)' }, { label: 'span 3', span: 3 }]
	},
	{
		value: 'ratio',
		label: '1fr 2fr 1fr',
		columns: ['1fr', '2fr', '1fr'],
		items: [{ label: '1fr' }, { label: '2fr' }, { label: '1fr' }, { label: 'span 2', span: 2 }, { label: '1fr' }]
	},
	{
		value: 'string',
		label: '字符串模板',
		columns: '100px repeat(3, 1fr)',
		items: [{ label: '100px' }, { label: '1fr' }, { label: '1fr' }, { label: '1fr' }, { label: '100px' }, { label: 'auto', span: 'auto' }]
	}
];

const current = ref(TEMPLATES[0].value);
const template = computed(() => TEMPLATES.find(item => item.value === current.value));
const columns = computed(() => template.value.columns);
const items = computed(() => template.value.items);
const source = computed(() => `:columns="${JSON.stringify(columns.value).replace(/"/g, '\'')}"`);
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
	width: 280px;
}

code {
	display: block;
	margin-bottom: 12px;
	color: var(--vc-color-dark-lightest);
}

.cell {
	height: 40px;
	padding: 0 12px;
	line-height: 40px;
	color: var(--vc-color-dark-light);
	white-space: nowrap;
	background: var(--vc-background-color-light);
	border-radius: 4px;
}
</style>
