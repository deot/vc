<template>
	<div :style="{ width: width, height: height }">
		<Chart
			ref="chart"
			:options="options"
			@ready="handleReady"
		/>
		<Button type="primary" @click="handleRepaint">重绘</Button>
	</div>
</template>
<script setup>
import { ref, onBeforeMount } from 'vue';
import { Chart } from '..';
import { Button } from '../../button';

const width = ref('400px');
const height = ref('400px');
const options = ref({});
const chart = ref();

const handleRepaint = () => {
	setOptions();
};

const setOptions = async () => {
	options.value = {};
	await new Promise(_ => setTimeout(_, 300));
	options.value = {
		xAxis: {
			type: 'category',
			data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
		},
		yAxis: {
			type: 'value'
		},
		series: [
			{
				data: [150, 230, 224, 218, 135, 147, 260],
				type: 'line'
			}
		]
	};
};
onBeforeMount(setOptions);

const handleReady = ({ dependencies }) => {
	console.log(dependencies.echarts);
};
</script>
