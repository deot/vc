## 画板（Artboard）

基于 canvas 的手写画板，支持绘制、重置、撤销、重做和导出图片。

移动端入口导出的 `MArtboard` 与 `Artboard` 是同一实现。

### 何时使用

需要采集签名、手写轨迹或简单涂写内容时使用。

### 基础用法

通过组件引用调用 `undo`、`redo` 和 `reset`；`change` 返回当前历史状态，可据此切换按钮的可用状态。暴露的 `canvas` 可直接导出图片，`options` 在挂载时合并到画布的 2D 上下文。

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
	<div class="artboard-demo">
		<div class="artboard-demo__surface">
			<Artboard
				ref="artboard"
				:options="drawingOptions"
				@change="handleChange"
			/>
		</div>
		<div class="artboard-demo__row">
			<Button :disabled="!state.allowUndo" @click="handleUndo">撤销</Button>
			<Button :disabled="!state.allowRedo" @click="handleRedo">重做</Button>
			<Button @click="handleReset">重置</Button>
			<Button type="primary" @click="handleExport">导出图片</Button>
		</div>
		<p class="artboard-demo__result">共 {{ state.snapshots.length }} 笔，当前应用 {{ state.current }} 笔</p>
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
	snapshots: [],
	current: 0,
	allowUndo: false,
	allowRedo: false
});
const drawingOptions = {
	strokeStyle: '#456cf6',
	shadowColor: 'transparent'
};

const handleChange = (payload) => {
	Object.assign(state, payload);
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
	display: flex;
	flex-direction: column;
	gap: 16px;
	width: 480px;
	max-width: 100%;
}

.artboard-demo__surface {
	height: 240px;
	background: var(--vc-background-color-lightest, #fff);
}

.artboard-demo__row {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 8px;
}

.artboard-demo__result {
	margin: 0;
}

.artboard-demo__preview {
	display: block;
	max-width: 100%;
}
</style>
```
:::

### 固定尺寸与回放

`width`、`height` 设置画布的固定尺寸（为 `0` 时读取布局尺寸），只在挂载时读取。`draw` 把一组坐标点画到画布上、`redraw` 只清空像素，两者都不改变历史，可配合 `change` 中的 `snapshots` 逐笔回放。暴露的 `context` 是画布的 2D 上下文，可在运行时修改笔触。

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
	<div class="artboard-demo">
		<Artboard
			ref="artboard"
			:width="320"
			:height="160"
			@change="handleChange"
		/>
		<div class="artboard-demo__row">
			<Button :disabled="!snapshots.length || isReplaying" @click="handleReplay">逐笔回放</Button>
			<Button @click="handleRedraw">清空像素</Button>
			<Button @click="handleToggleWidth">{{ isBold ? '细笔触' : '粗笔触' }}</Button>
		</div>
		<p class="artboard-demo__result">{{ status }}</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Artboard, Button } from '@deot/vc';

const artboard = ref(null);
const snapshots = ref([]);
const isReplaying = ref(false);
const isBold = ref(false);
const status = ref('在画布上写几笔后点击回放');

const handleChange = (payload) => {
	snapshots.value = payload.snapshots.slice(0, payload.current);
};

const handleReplay = () => {
	isReplaying.value = true;
	artboard.value.redraw();
	snapshots.value.forEach((step, index) => {
		setTimeout(() => {
			artboard.value.draw(step);
			status.value = `回放第 ${index + 1} / ${snapshots.value.length} 笔`;
			index === snapshots.value.length - 1 && (isReplaying.value = false);
		}, (index + 1) * 300);
	});
};

const handleRedraw = () => {
	artboard.value.redraw();
	status.value = '已清空像素，历史保留，可回放恢复';
};

const handleToggleWidth = () => {
	isBold.value = !isBold.value;
	artboard.value.context.lineWidth = isBold.value ? 6 : 2;
};
</script>

<style scoped>
.artboard-demo {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 16px;
}

.artboard-demo__row {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 8px;
}

.artboard-demo__result {
	margin: 0;
}
</style>
```
:::

## 主题与局部覆盖

全局参数通过 `--vc-<参数>` 配置，单个组件通过 `--vc-artboard-<参数>` 覆盖。同一参数可能作用于多个状态；多命名空间时在使用位置中标明。

### 全局

| 参数 | 使用位置 | 值 |
| --- | --- | --- |
| color-neutral-light | 画布边框 | 亮色：`#EDEFF1`；暗色：`#3B4354` |

### 局部

当前组件没有额外的局部 CSS 主题参数。

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
