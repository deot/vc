## 图像处理（ImageProcessor）
图像处理组件，基于 canvas 输出原图、抠图、置灰或自定义增强结果。

### 何时使用
需要在前端把图片绘制到固定尺寸 canvas，并获得处理后的 `ImageData`。

### 基础用法
通过 `enhancer` 选择内置处理器，`options` 传递处理参数。

:::RUNTIME
```vue
<template>
	<div class="v-image-processor-basic">
		<img :src="image" width="100" height="100">
		<ImageProcessor
			:src="image"
			:output-size="100"
			enhancer="cutout"
			:options="{ targetColor: [255, 255, 255, 1], tolerance: 16 }"
		/>
	</div>
</template>
<script setup>
import { ImageProcessor } from '@deot/vc';

const image = 'https://github.githubassets.com/favicons/favicon.svg';
</script>
```
:::

### 自定义处理
自定义增强器接收 `(imageData, options)`，可以直接修改 `imageData` 后返回 `void`，也可以同步或异步返回新的 `ImageData`。

:::RUNTIME
```vue
<template>
	<ImageProcessor
		:src="image"
		:output-size="[120, 80]"
		:enhancer="enhance"
		:options="{ channel: 'red' }"
	/>
</template>
<script setup>
import { ImageProcessor } from '@deot/vc';

const image = 'https://github.githubassets.com/favicons/favicon.svg';

const enhance = (imageData, options) => {
	const { data } = imageData;

	for (let i = 0; i < data.length; i += 4) {
		if (options.channel === 'red') {
			data[i + 1] = 0;
			data[i + 2] = 0;
		}
	}
};
</script>
```
:::

## API

### 基础属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| src | 图片来源 | `string \| Blob \| File \| ImageData \| CanvasImageSource` | - | - |
| outputSize | 输出 canvas 尺寸 | `number \| [number] \| [number, number]` | - | `100` |
| enhancer | 图像处理方式 | `'cutout' \| 'gray' \| ImageEnhancer` | `cutout`、`gray` | - |
| options | 传给处理器的选项 | `Record<string, any>` | - | `{}` |
| crossOrigin | 图片跨域设置 | `'' \| 'anonymous' \| 'use-credentials'` | - | `anonymous` |

### options

`cutout` 支持：

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| targetColor | 要抠除的目标颜色，RGBA 格式 | `number[]` | `[0, 0, 0, 1]` |
| tolerance | 颜色容差 | `number` | `0` |

### Events

| 事件名 | 说明 | 回调参数 |
| --- | --- | --- |
| error | 处理失败 | `(error: unknown)` |

### Expose

| 名称 | 说明 |
| --- | --- |
| canvas | 当前 canvas |
| context | 当前 2D context |
| refresh | 按当前输入重新绘制并处理图像 |

### 静态工具

| 名称 | 说明 |
| --- | --- |
| `ImageProcessor.Enhancer.gray` | RGB 平均值置灰 |
| `ImageProcessor.Enhancer.cutout` | 按 `targetColor` 和 `tolerance` 抠除像素 |
| `ImageProcessor.Enhancer.getImageData` | 将来源绘制到临时 canvas 并返回 `ImageData` |
