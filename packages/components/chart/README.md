[link]: https://www.echartsjs.com/zh/option.html#title

## 功能（Chart）
Chart图表

### 何时使用

- 展示可视化的图表
- 参照ECharts官方配置[文档][link]

### 基础用法

通过options完成图表配置。

:::RUNTIME
```vue
<template>
	<div style="height: 320px;">
		<Chart :options="options"/>
	</div>
</template>
<script setup>
import { computed } from 'vue';
import { Chart, Button } from '@deot/vc';

const options = computed(() => {
	const data = [];
	for (let i = 0; i <= 360; i++) {
		const t = i / 180 * Math.PI;
		const r = Math.sin(2 * t) * Math.cos(2 * t);
		data.push([r, i]);
	}
	return {
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
</script>
```
:::

### 自适应容器大小
通过autoResize属性设置图表是否在组件根元素尺寸变化时自动进行重绘，默认：`false`。

:::RUNTIME
```vue
<template>
	<div>
		<p>当前设置autoResize为true<p>
			<Button @click="handleClick">改变容器大小</Button>
		<div :style="{height: wrapperHeight}">
			<Chart :options="options" :resize="true"/>
		</div>
	</div>
</template>
<script setup>
import { computed, ref } from 'vue';
import { Chart, Button } from '@deot/vc';

const wrapperHeight = ref('320px');
const options = computed(() => {
	const data = [];
	for (let i = 0; i <= 360; i++) {
		const t = i / 180 * Math.PI;
		const r = Math.sin(2 * t) * Math.cos(2 * t);
		data.push([r, i]);
	}
	return {
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
const handleClick = () => {
	wrapperHeight.value = wrapperHeight.value == '400px' ? '320px' : '400px';
};
</script>
```
:::

### API

### 基础属性
| 属性          | 说明                                 | 类型        | 可选值 | 默认值     |
| ----------- | ---------------------------------- | --------- | --- | ------- |
| options     | 图表配置，参照Chart官方配置[文档][link]       | `object`  | -   | -       |
| resize | 指定 ECharts 实例在组件根元素尺寸变化时是否需要自动进行重绘 | `boolean`、`boolean` | -   | `100` |

