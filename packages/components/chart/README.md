## 图表（Chart）

基于 ECharts 渲染图表，支持配置更新、容器尺寸监听和图表事件转发。`MChart` 是 `Chart` 的别名，使用相同的 API。

### 何时使用

需要在 Vue 页面中展示数据可视化内容时使用。通过 `options` 提供 ECharts 配置。图表根元素宽高均为 `100%`，父容器需要具有明确尺寸。

### 基础用法

默认深度监听 `options`：修改对象内部字段时合并配置，替换整个对象时以新配置覆盖。点击柱形可接收对应的 ECharts 事件参数。

:::playground
<!-- <config lang="json5">{ previewInset: 16 }</config> -->
```vue
<template>
	<div>
		<Button @click="handleUpdate">更新数据</Button>
		<p>{{ selected }}</p>
		<div style="height: 300px;">
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
	series: [{ name: '访问量', type: 'bar', data: [120, 200, 150, 80, 170] }]
});
const handleUpdate = () => {
	options.value.series[0].data = options.value.series[0].data.map(value => value >= 240 ? 80 : value + 20);
};
const handleSelect = ({ name, value }) => {
	selected.value = `${name}：${value}`;
};
</script>
```
:::

### 自适应容器大小

`resize` 默认为 `100`，使用 100 毫秒防抖处理容器尺寸变化，并在首次调用时立即执行。设为 `true` 或 `0` 时不防抖，设为 `false` 时关闭自动调整。

:::playground
<!-- <config lang="json5">{ previewInset: 16 }</config> -->
```vue
<template>
	<div>
		<Button @click="handleResize">切换容器尺寸</Button>
		<p>当前高度：{{ isExpanded ? 360 : 240 }}px</p>
		<div :style="{ height: isExpanded ? '360px' : '240px' }">
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
			{ name: '搜索', value: 48 },
			{ name: '直接访问', value: 32 },
			{ name: '推荐', value: 20 }
		]
	}]
};
const handleResize = () => {
	isExpanded.value = !isExpanded.value;
};
</script>
```
:::

### 手动更新

在挂载时设置 `manual-update`，通过组件 ref 的 `chart.setOption()` 更新实例。仍需传入初始 `options` 以创建实例；`ready` 表示依赖已加载，此时如果没有传入 `options`，其 `instance` 为 `null`。

:::playground
<!-- <config lang="json5">{ previewInset: 16 }</config> -->
```vue
<template>
	<div>
		<Button :disabled="!isReady" @click="handleUpdate">手动更新数据</Button>
		<p>更新次数：{{ count }}</p>
		<div style="height: 280px;">
			<Chart ref="chartRef" :options="options" manual-update @ready="handleReady" />
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
```
:::

## API

### 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| options | ECharts 配置；未提供时不创建图表实例 | `object` | - | - |
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
