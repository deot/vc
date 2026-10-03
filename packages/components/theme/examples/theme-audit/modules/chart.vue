<template>
	<div class="audit-stack">
		<div class="audit-chart"><Chart :options="options" /></div>
		<p class="audit-hint">图表颜色由 options 配置；此例将坐标轴、图例、提示层及系列映射到主题，hover 查看提示。</p>
	</div>
</template>
<script setup>
import { inject, onMounted, ref, watch } from 'vue';
import { Chart } from '@deot/vc';

const state = inject('theme-audit');
const options = ref({});
const refresh = () => {
	const style = getComputedStyle(document.body);
	const color = name => style.getPropertyValue(`--vc-${name}`).trim();
	options.value = {
		color: [color('color-primary'), color('color-success')],
		textStyle: { color: color('foreground-color') },
		legend: { textStyle: { color: color('foreground-color') } },
		tooltip: {
			trigger: 'axis', backgroundColor: color('background-color-lightest'), borderColor: color('color-neutral-light'),
			textStyle: { color: color('foreground-color') }
		},
		grid: { left: 36, right: 16, bottom: 30 },
		xAxis: {
			type: 'category', data: ['周一', '周二', '周三', '周四'], axisLabel: { color: color('foreground-color-light') },
			axisLine: { lineStyle: { color: color('border-color') } }
		},
		yAxis: {
			type: 'value', axisLabel: { color: color('foreground-color-light') },
			splitLine: { lineStyle: { color: color('color-neutral-light') } }
		},
		series: [{ name: '访问', type: 'bar', data: [20, 35, 24, 48] }, { name: '完成', type: 'line', data: [15, 28, 18, 40] }]
	};
};
onMounted(refresh);
watch(() => [state.effectiveMode.value, JSON.stringify(state.liveChanges.value)],
	refresh,
	{ flush: 'post' });
</script>
