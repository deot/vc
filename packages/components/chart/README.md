## 图表（Chart）

基于 ECharts 渲染图表，支持配置更新、容器尺寸监听和图表事件转发。

移动端入口导出的 `MChart` 与 `Chart` 是同一实现。

### 何时使用

需要在 Vue 页面中展示数据可视化内容时使用。通过 `options` 提供 ECharts 配置。图表根元素宽高均为 `100%`，父容器需要具有明确尺寸。

### 基础用法

默认深度监听 `options`：修改对象内部字段时合并配置，替换整个对象时以新配置覆盖。点击柱形时，`click` 事件收到对应的 ECharts 事件参数。

:::playground
<!--
<config lang="json5">
{
	views: ['runtime', 'files'],
	previewInset: 16
}
</config>
-->
```vue
<template>
	<div class="chart-demo">
		<div class="chart-demo__row">
			<Button @click="handleUpdate">更新数据</Button>
		</div>
		<p class="chart-demo__result">{{ selected }}</p>
		<div class="chart-demo__canvas">
			<Chart :options="options" @click="handleSelect" />
		</div>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Chart, Button } from '@deot/vc';

const selected = ref('点击柱形查看数据');
const options = ref({
	tooltip: { trigger: 'axis' },
	grid: { left: 48, right: 20, top: 24, bottom: 32 },
	xAxis: { type: 'category', data: ['周一', '周二', '周三', '周四', '周五'] },
	yAxis: { type: 'value' },
	series: [{ name: '数值', type: 'bar', data: [120, 200, 150, 80, 170] }]
});

const handleUpdate = () => {
	options.value.series[0].data = options.value.series[0].data.map(value => (value >= 240 ? 80 : value + 20));
};

const handleSelect = ({ name, value }) => {
	selected.value = `${name}：${value}`;
};
</script>

<style scoped>
.chart-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.chart-demo__row {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 8px;
}

.chart-demo__result {
	margin: 0;
}

.chart-demo__canvas {
	height: 300px;
}
</style>
```
:::

### 自适应容器大小

`resize` 默认为 `100`，使用 100 毫秒防抖处理容器尺寸变化，并在首次调用时立即执行。设为 `true` 或 `0` 时不防抖，设为 `false` 时关闭自动调整。

:::playground
<!--
<config lang="json5">
{
	views: ['runtime', 'files'],
	previewInset: 16
}
</config>
-->
```vue
<template>
	<div class="chart-demo">
		<div class="chart-demo__row">
			<Button @click="handleResize">切换容器尺寸</Button>
		</div>
		<p class="chart-demo__result">当前高度：{{ isExpanded ? 360 : 240 }}px</p>
		<div class="chart-demo__canvas" :class="{ 'is-expanded': isExpanded }">
			<Chart :options="options" :resize="true" />
		</div>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Chart, Button } from '@deot/vc';

const isExpanded = ref(false);
const options = {
	tooltip: { trigger: 'item' },
	series: [{
		type: 'pie',
		radius: ['35%', '65%'],
		label: { position: 'inside' },
		data: [
			{ name: '分类 A', value: 48 },
			{ name: '分类 B', value: 32 },
			{ name: '分类 C', value: 20 }
		]
	}]
};

const handleResize = () => {
	isExpanded.value = !isExpanded.value;
};
</script>

<style scoped>
.chart-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.chart-demo__row {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 8px;
}

.chart-demo__result {
	margin: 0;
}

.chart-demo__canvas {
	height: 240px;
}

.chart-demo__canvas.is-expanded {
	height: 360px;
}
</style>
```
:::

### 手动更新

在挂载时设置 `manual-update`，通过组件 ref 的 `chart.setOption()` 更新实例。仍需传入初始 `options` 以创建实例；`ready` 表示依赖已加载，此时如果没有传入 `options`，其 `instance` 为 `null`。

:::playground
<!--
<config lang="json5">
{
	views: ['runtime', 'files'],
	previewInset: 16
}
</config>
-->
```vue
<template>
	<div class="chart-demo">
		<div class="chart-demo__row">
			<Button :disabled="!isReady" @click="handleUpdate">手动更新数据</Button>
		</div>
		<p class="chart-demo__result">更新次数：{{ count }}</p>
		<div class="chart-demo__canvas">
			<Chart
				ref="chartRef"
				:options="options"
				manual-update
				@ready="handleReady"
			/>
		</div>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Chart, Button } from '@deot/vc';

const chartRef = ref();
const isReady = ref(false);
const count = ref(0);
const options = {
	grid: { left: 48, right: 20, top: 24, bottom: 32 },
	xAxis: { type: 'category', data: ['一月', '二月', '三月'] },
	yAxis: { type: 'value' },
	series: [{ type: 'line', data: [30, 50, 40] }]
};

const handleReady = ({ instance }) => {
	isReady.value = !!instance;
};

const handleUpdate = () => {
	count.value += 1;
	chartRef.value.chart.setOption({
		series: [{ data: [30 + count.value * 5, 50 + count.value * 3, 40 + count.value * 4] }]
	});
};
</script>

<style scoped>
.chart-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.chart-demo__row {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 8px;
}

.chart-demo__result {
	margin: 0;
}

.chart-demo__canvas {
	height: 280px;
}
</style>
```
:::

### 浅监听与图例事件

`watch-shallow` 只监听 `options` 的引用：修改内部字段不会更新图表，替换整个对象才会生效。图例、数据区域等 ECharts 事件同样以同名组件事件转发，例如 `legendselectchanged`。

:::playground
<!--
<config lang="json5">
{
	views: ['runtime', 'files'],
	previewInset: 16
}
</config>
-->
```vue
<template>
	<div class="chart-demo">
		<div class="chart-demo__row">
			<Button @click="handleMutate">只改内部字段</Button>
			<Button type="primary" @click="handleReplace">替换整个对象</Button>
		</div>
		<p class="chart-demo__result">{{ legendText }}</p>
		<div class="chart-demo__canvas">
			<Chart :options="options" watch-shallow @legendselectchanged="handleLegendChange" />
		</div>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Chart, Button } from '@deot/vc';

const createOptions = data => ({
	legend: { top: 0 },
	tooltip: { trigger: 'axis' },
	grid: { left: 48, right: 20, top: 40, bottom: 32 },
	xAxis: { type: 'category', data: ['第一季', '第二季', '第三季', '第四季'] },
	yAxis: { type: 'value' },
	series: [
		{ name: '系列 A', type: 'line', data },
		{ name: '系列 B', type: 'line', data: data.map(value => value / 2) }
	]
});

const options = ref(createOptions([40, 60, 50, 80]));
const legendText = ref('点击图例切换系列');

const handleMutate = () => {
	options.value.series[0].data = options.value.series[0].data.map(value => value + 10);
};

const handleReplace = () => {
	options.value = createOptions(options.value.series[0].data);
};

const handleLegendChange = ({ name, selected }) => {
	legendText.value = `${name}：${selected[name] ? '显示' : '隐藏'}`;
};
</script>

<style scoped>
.chart-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.chart-demo__row {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 8px;
}

.chart-demo__result {
	margin: 0;
}

.chart-demo__canvas {
	height: 280px;
}
</style>
```
:::

### 主题与初始化选项

`theme` 和 `pluginOptions` 分别作为 `echarts.init` 的第二、三个参数，变化时会重建实例；`group` 设置实例分组，联动还需调用 ECharts 的 `connect`。默认插槽渲染在图表根容器内，适合放置叠加层；`refresh` 销毁并重建当前实例。

:::playground
<!--
<config lang="json5">
{
	views: ['runtime', 'files'],
	previewInset: 16
}
</config>
-->
```vue
<template>
	<div class="chart-demo">
		<div class="chart-demo__row">
			<Button @click="handleToggleTheme">{{ isDark ? '默认主题' : 'dark 主题' }}</Button>
			<Button @click="handleToggleRenderer">切换为 {{ renderer === 'canvas' ? 'svg' : 'canvas' }}</Button>
			<Button @click="handleRefresh">重建实例</Button>
		</div>
		<p class="chart-demo__result">渲染器：{{ renderer }}，手动重建 {{ refreshCount }} 次</p>
		<div class="chart-demo__canvas">
			<Chart
				ref="chartRef"
				:options="options"
				:theme="isDark ? 'dark' : undefined"
				:plugin-options="{ renderer }"
				group="chart-demo"
			>
				<span class="chart-demo__badge">分组 chart-demo</span>
			</Chart>
		</div>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Chart, Button } from '@deot/vc';

const chartRef = ref();
const isDark = ref(false);
const renderer = ref('canvas');
const refreshCount = ref(0);
const options = {
	grid: { left: 48, right: 20, top: 24, bottom: 32 },
	xAxis: { type: 'category', data: ['A', 'B', 'C', 'D', 'E'] },
	yAxis: { type: 'value' },
	series: [{ type: 'bar', data: [32, 48, 24, 56, 40] }]
};

const handleToggleTheme = () => {
	isDark.value = !isDark.value;
};

const handleToggleRenderer = () => {
	renderer.value = renderer.value === 'canvas' ? 'svg' : 'canvas';
};

const handleRefresh = () => {
	chartRef.value.refresh();
	refreshCount.value++;
};
</script>

<style scoped>
.chart-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.chart-demo__row {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 8px;
}

.chart-demo__result {
	margin: 0;
}

.chart-demo__canvas {
	position: relative;
	height: 280px;
}

.chart-demo__badge {
	position: absolute;
	top: 0;
	right: 0;
	z-index: 1;
	font-size: 12px;
	color: var(--vc-color-dark-lighter, #515151);
}
</style>
```
:::

## API

### 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| options | ECharts 配置；未提供时不创建图表实例，已创建后置空等同于清空图表 | `object` | - | - |
| pluginOptions | 传给 `echarts.init` 的第三个参数，如渲染器和像素比 | `object` | - | - |
| theme | 传给 `echarts.init` 的主题名称或主题对象 | `string \| object` | ECharts 内置或已注册主题、主题对象 | - |
| group | 图表实例分组；联动需另行调用 ECharts 的 `connect` | `string` | - | - |
| resize | 自动调整尺寸；数字表示防抖间隔（毫秒），`true` / `0` 不防抖，`false` 关闭 | `boolean \| number` | - | `100` |
| watchShallow | 挂载时决定是否仅监听 `options` 引用变化 | `boolean` | - | `false` |
| manualUpdate | 挂载时决定是否关闭 `options` 自动监听 | `boolean` | - | `false` |

`manualUpdate` 和 `watchShallow` 的监听策略在 setup 时建立，运行时修改这两个属性只会重建已有实例，不会重新配置监听策略。需要切换策略时，通过 Vue `key` 重新挂载组件。

`theme`、`pluginOptions`、`resize`、`manualUpdate` 和 `watchShallow` 变化时会重建已有实例；`group` 变化直接同步到当前实例。重建可能清除通过 ECharts 实例直接设置的配置和交互状态，应保留完整的 `options`。`manualUpdate` 为 `true` 时，后续仅提供 `options` 不会触发初始化。

### 事件

| 事件名 | 说明 | 回调参数 | 参数说明 |
| --- | --- | --- | --- |
| ready | 挂载后 ECharts 依赖加载完成时触发一次；重建实例不重复触发 | `{ instance, dependencies: { echarts } }` | `instance` 为当前 ECharts 实例或 `null`；`echarts` 为加载的 ECharts 模块 |
| 下列 ECharts 事件 | 将实例事件以同名组件事件转发 | `params` | 原始 ECharts 事件参数，内容取决于事件类型 |

支持转发的事件名称：

- 鼠标事件：`click`、`dblclick`、`mouseover`、`mouseout`、`mousemove`、`mousedown`、`mouseup`、`globalout`、`contextmenu`。
- 图例与数据事件：`legendselectchanged`、`legendselected`、`legendunselected`、`legendunscroll`、`datazoom`、`datarangeselected`、`timelinechanged`、`timelineplaychanged`、`restore`、`dataviewchanged`、`magictypechanged`。
- 选择与关系事件：`geoselectchanged`、`geoselected`、`geounselected`、`pieselectchanged`、`pieselected`、`pieunselected`、`mapselectchanged`、`mapselected`、`mapunselected`、`axisareaselected`、`focusnodeadjacency`、`unfocusnodeadjacency`、`brush`、`brushselected`。
- 渲染事件：`rendered`、`finished`。

这些名称按当前组件注册列表列出，实际是否触发取决于所用 ECharts 版本和图表配置。初次 `setOption` 早于事件注册，不应依赖首次渲染事件判定组件就绪。

### 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 渲染在图表根容器内；布局需避免影响 ECharts 画布 | - |

### 方法

| 方法名 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| refresh | 销毁并重建已有 ECharts 实例；尚未初始化时无操作 | - | `void` |

组件 ref 同时暴露 `chart`，其值为 ECharts 实例，尚未初始化或销毁后为 `null`。可调用 `chart.setOption()`、`chart.resize()` 等 ECharts 实例方法。实例重建后应重新读取 `chart`，避免持有已销毁的实例。

### 主题与依赖

图表颜色和内置提示由 ECharts 的配置与主题决定；组件不会自动将 `@deot/vc` 的亮暗主题或 locale 同步给 ECharts。可通过 `theme` 和 `options` 显式配置，ECharts 初始化选项通过 `pluginOptions` 传入。

组件优先使用 `window.echarts`，否则动态导入 `echarts`。使用已注册的自定义主题时，需在初始化前向实际使用的 ECharts 模块注册。
