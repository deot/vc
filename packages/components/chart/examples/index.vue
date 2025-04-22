<template>
	<div :style="{ width: width, height: height }">
		<Chart
			:options="polar"
			:auto-resize="true"
			@ready="handleReady"
		/>
	</div>
</template>
<script setup>
import { ref, onBeforeMount } from 'vue';
import { Chart } from '..';

const width = ref('400px');
const height = ref('400px');
const polar = ref({});

onBeforeMount(() => {
	setTimeout(() => {
		width.value = '800px';
		height.value = '800px';
	}, 3000);

	const data = [];

	for (let i = 0; i <= 360; i++) {
		const t = (i / 180) * Math.PI;
		const r = Math.sin(2 * t) * Math.cos(2 * t);
		data.push([r, i]);
	}
	polar.value = {
		title: {
			text: '极坐标双数值轴'
		},
		legend: {
			data: ['line']
		},
		polar: {
			center: ['50%', '54%']
		},
		tooltip: {
			trigger: 'axis',
			axisPointer: {
				type: 'cross'
			}
		},
		angleAxis: {
			type: 'value',
			startAngle: 0
		},
		radiusAxis: {
			min: 0
		},
		series: [
			{
				coordinateSystem: 'polar',
				name: 'line',
				type: 'line',
				showSymbol: false,
				data
			}
		],
		animationDuration: 2000
	};
});

const handleReady = ({ dependencies }) => {
	console.log(dependencies.echarts);
};
</script>
