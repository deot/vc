## 画板（Artboard）

基于 canvas 的手写画板，支持绘制、重置、撤销、重做和导出图片。

移动端入口导出的 `MArtboard` 当前是 `Artboard` 的别名，共用相同的属性、事件和方法。

### 何时使用

需要采集签名、手写轨迹或简单涂写内容时使用。

### 基础用法

通过组件引用调用撤销、重做和重置方法，也可以从暴露的 `canvas` 导出图片。

:::playground
<!--
<config lang="json5">
{
	previewInset: 16
}
</config>
-->
```vue
<template>
	<div class="artboard-demo">
		<Artboard
			ref="artboard"
			class="artboard-demo__canvas"
			:options="drawingOptions"
			@change="handleChange"
		/>
		<div class="artboard-demo__actions">
			<Button :disabled="!state.allowUndo" @click="handleUndo">
				撤销
			</Button>
			<Button :disabled="!state.allowRedo" @click="handleRedo">
				重做
			</Button>
			<Button @click="handleReset">
				重置
			</Button>
			<Button @click="handleExport">
				导出图片
			</Button>
		</div>
		<img
			v-if="imageUrl"
			class="artboard-demo__preview"
			:src="imageUrl"
			alt="导出的画板内容"
		>
	</div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { Artboard, Button } from '@deot/vc';

const artboard = ref(null);
const imageUrl = ref('');
const state = reactive({
	allowUndo: false,
	allowRedo: false
});
const drawingOptions = {
	strokeStyle: '#456cf6',
	shadowColor: 'transparent'
};

const handleChange = (payload) => {
	state.allowUndo = payload.allowUndo;
	state.allowRedo = payload.allowRedo;
};

const handleUndo = () => artboard.value?.undo();
const handleRedo = () => artboard.value?.redo();
const handleReset = () => artboard.value?.reset();
const handleExport = () => {
	imageUrl.value = artboard.value?.canvas.toDataURL('image/png') || '';
};
</script>

<style scoped>
.artboard-demo {
	width: 100%;
	max-width: 480px;
}

.artboard-demo__canvas {
	height: 240px;
}

.artboard-demo__actions {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
	margin-top: 12px;
}

.artboard-demo__preview {
	display: block;
	max-width: 100%;
	margin-top: 12px;
}
</style>
```
:::

## API

### 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| options | 初始化时合并到 `CanvasRenderingContext2D` 的配置 | `object` | - | - |
| width | 画布宽度；为 `0` 时读取画布的布局宽度 | `number` | - | `0` |
| height | 画布高度；为 `0` 时读取画布的布局高度 | `number` | - | `0` |

`options`、`width` 和 `height` 在组件挂载时读取，之后改变属性不会重新初始化画布。

### 事件

| 事件名 | 说明 | 回调参数 | 参数说明 |
| --- | --- | --- | --- |
| change | 完成一笔绘制、重置、撤销或重做后触发 | `(state) => void` | `state` 为当前历史状态 |

`state` 包含以下字段：

| 字段 | 说明 | 类型 |
| --- | --- | --- |
| snapshots | 全部绘制步骤；每一步由画布坐标点组成 | `Array<Array<{ x: number; y: number }>>` |
| current | 当前已经应用的步骤数 | `number` |
| allowRedo | 当前是否可以重做 | `boolean` |
| allowUndo | 当前是否可以撤销 | `boolean` |

### 暴露属性

通过组件引用在挂载后访问。

| 属性 | 说明 | 类型 |
| --- | --- | --- |
| canvas | 组件内部的画布元素 | `HTMLCanvasElement` |
| context | 画布的 2D 渲染上下文 | `CanvasRenderingContext2D` |

### 方法

| 方法名 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| reset | 清空画布和全部历史，并触发 `change` | - | `void` |
| undo | 撤销最近一步；没有可撤销步骤时不执行操作 | - | `void` |
| redo | 重做最近撤销的一步；没有可重做步骤时不执行操作 | - | `void` |
| redraw | 只清空当前画布像素，不改变历史 | - | `void` |
| draw | 将一组坐标点绘制到画布，不改变历史 | `Array<{ x: number; y: number }>` | `void` |
