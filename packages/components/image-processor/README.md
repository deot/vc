## 图像处理（ImageProcessor）

图像处理组件，基于 canvas 输出原图、抠图、置灰或自定义增强结果。

移动端入口导出的 `MImageProcessor` 与 `ImageProcessor` 是同一实现。

### 何时使用

- 需要在前端把图片绘制到固定尺寸的 canvas，并获得处理后的 `ImageData`。
- 需要对图片做抠图、置灰或自定义像素处理后再展示。

### 基础用法

通过 `enhancer` 选择内置处理器，`options` 传递处理参数，`outputSize` 设置 canvas 像素尺寸。

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
	<div class="image-processor-demo">
		<figure class="image-processor-demo__figure">
			<figcaption class="image-processor-demo__caption">原图</figcaption>
			<img :src="image" width="100" height="100" alt="原图">
		</figure>
		<figure class="image-processor-demo__figure">
			<figcaption class="image-processor-demo__caption">抠图</figcaption>
			<div class="image-processor-demo__checkerboard">
				<ImageProcessor
					:src="image"
					:output-size="100"
					enhancer="cutout"
					:options="{ targetColor: [255, 255, 255, 1], tolerance: 16 }"
					aria-label="抠图结果"
				/>
			</div>
		</figure>
		<figure class="image-processor-demo__figure">
			<figcaption class="image-processor-demo__caption">置灰</figcaption>
			<ImageProcessor :src="image" :output-size="100" enhancer="gray" aria-label="置灰结果" />
		</figure>
	</div>
</template>

<script setup>
import { ImageProcessor } from '@deot/vc';

const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">'
	+ '<rect width="100" height="100" fill="white"/>'
	+ '<circle cx="50" cy="50" r="32" fill="#e08040"/></svg>';
const image = `data:image/svg+xml,${encodeURIComponent(svg)}`;
</script>

<style scoped>
.image-processor-demo {
	display: flex;
	flex-wrap: wrap;
	gap: 16px;
}

.image-processor-demo__figure {
	display: flex;
	flex-direction: column;
	gap: 8px;
	margin: 0;
}

.image-processor-demo__caption {
	font-size: 13px;
	font-weight: 600;
}

.image-processor-demo__checkerboard {
	display: flex;
	background: repeating-conic-gradient(#eee 0 25%, #fff 0 50%) 0 / 16px 16px;
}
</style>
```
:::

### 自定义处理

自定义增强器接收 `(imageData, options)`，可以直接修改 `imageData` 后返回 `void`，也可以同步或异步返回新的 `ImageData`。`outputSize` 传双元素数组时分别表示宽、高。

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
	<div class="image-processor-demo">
		<figure class="image-processor-demo__figure">
			<figcaption class="image-processor-demo__caption">原图</figcaption>
			<img :src="image" width="120" height="80" alt="原图">
		</figure>
		<figure class="image-processor-demo__figure">
			<figcaption class="image-processor-demo__caption">仅保留红色通道</figcaption>
			<ImageProcessor
				:src="image"
				:output-size="[120, 80]"
				:enhancer="handleEnhance"
				:options="{ channel: 'red' }"
				aria-label="红色通道结果"
			/>
		</figure>
	</div>
</template>

<script setup>
import { ImageProcessor } from '@deot/vc';

const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80">'
	+ '<rect width="120" height="80" fill="#e08040"/>'
	+ '<circle cx="60" cy="40" r="24" fill="#4080c0"/></svg>';
const image = `data:image/svg+xml,${encodeURIComponent(svg)}`;

const handleEnhance = (imageData, options) => {
	const { data } = imageData;

	for (let i = 0; i < data.length; i += 4) {
		if (options.channel === 'red') {
			data[i + 1] = 0;
			data[i + 2] = 0;
		}
	}
};
</script>

<style scoped>
.image-processor-demo {
	display: flex;
	flex-wrap: wrap;
	gap: 16px;
}

.image-processor-demo__figure {
	display: flex;
	flex-direction: column;
	gap: 8px;
	margin: 0;
}

.image-processor-demo__caption {
	font-size: 13px;
	font-weight: 600;
}
</style>
```
:::

### 手动刷新与加载失败

通过模板 ref 调用 `refresh()` 重新绘制，返回处理后的 `ImageData`。来源加载或处理失败时触发 `error` 事件，`refresh()` 返回 `undefined`。`crossOrigin` 设置远程图片的跨域方式，服务端仍需允许跨域读取。

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
	<div class="image-processor-demo">
		<div class="image-processor-demo__row">
			<Button @click="handleRefresh">refresh()</Button>
			<Button @click="handleToggle">{{ isBroken ? '恢复来源' : '切换为无效地址' }}</Button>
		</div>
		<ImageProcessor
			ref="processor"
			:src="isBroken ? 'https://example.invalid/image.png' : image"
			:output-size="[120, 80]"
			enhancer="gray"
			cross-origin="anonymous"
			aria-label="处理结果"
			@error="handleError"
		/>
		<p class="image-processor-demo__result">{{ result }}</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Button, ImageProcessor } from '@deot/vc';

const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80">'
	+ '<rect width="120" height="80" fill="#e08040"/>'
	+ '<circle cx="60" cy="40" r="24" fill="#4080c0"/></svg>';
const image = `data:image/svg+xml,${encodeURIComponent(svg)}`;

const processor = ref();
const isBroken = ref(false);
const result = ref('等待操作');

const handleRefresh = async () => {
	const imageData = await processor.value.refresh();
	result.value = imageData
		? `refresh：${imageData.width} × ${imageData.height}`
		: 'refresh：undefined';
};

const handleToggle = () => {
	isBroken.value = !isBroken.value;
	result.value = isBroken.value ? '正在加载无效地址' : '已恢复来源';
};

const handleError = () => {
	result.value = 'error：来源加载失败';
};
</script>

<style scoped>
.image-processor-demo {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 16px;
}

.image-processor-demo__row {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 8px;
}

.image-processor-demo__result {
	margin: 0;
}
</style>
```
:::

## API

### 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| src | 图片来源；未提供或为空字符串时清空画布 | `string \| Blob \| File \| ImageData \| CanvasImageSource` | - | `undefined` |
| outputSize | canvas 像素尺寸；数字或单元素数组表示正方形，双元素数组表示宽、高 | `number \| [number] \| [number, number]` | - | `100` |
| enhancer | 图像处理方式；未指定时只绘制来源 | `'cutout' \| 'gray' \| ImageEnhancer` | `cutout`、`gray` | `undefined` |
| options | 传给处理器的选项 | `Record<string, any>` | - | `{}` |
| crossOrigin | 图片跨域设置 | `'' \| 'anonymous' \| 'use-credentials'` | - | `anonymous` |

### 抠图选项

`cutout` 支持：

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| targetColor | 要抠除的目标颜色，RGBA 格式；alpha 在 0–1 时转换为 0–255，各通道取整并限制到 0–255 | `number[]` | `[0, 0, 0, 1]` |
| tolerance | 各 RGBA 通道允许的差值；全部匹配时将 alpha 置为 0，负值按 0 处理 | `number` | `0` |

### 事件

| 事件名 | 说明 | 回调参数 | 参数说明 |
| --- | --- | --- | --- |
| error | 当前请求加载或处理失败 | `(error: unknown)` | 捕获到的异常；JSX/config 对应 `onError` |

### 方法

| 方法名 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| refresh | 按当前输入重新绘制并处理图像；失败时触发 `error` 并返回 `undefined` | - | `Promise<ImageData \| undefined>` |

通过模板 ref 还可访问 `canvas: HTMLCanvasElement | null` 和 `context: CanvasRenderingContext2D | null`，初始化前可能为 `null`。组件挂载后以及输入属性变化时自动刷新，`outputSize` 和 `options` 的变化采用深度监听。没有来源或尚未挂载时，`refresh()` 返回的 Promise 解析为 `undefined`。

### 静态工具

| 方法名 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| `ImageProcessor.Enhancer.gray` | 原地将 RGB 改为四舍五入后的平均值，保留 alpha | `(imageData: ImageData)` | 原 `ImageData` |
| `ImageProcessor.Enhancer.cutout` | 原地按目标颜色和容差将匹配像素变透明 | `(imageData: ImageData, options?: ImageProcessorOptions)` | 原 `ImageData` |
| `ImageProcessor.Enhancer.getImageData` | 将来源绘制到临时 canvas；失败时 Promise 拒绝 | `(source: ImageProcessorSource, outputSize = 100, crossOrigin = 'anonymous')` | `Promise<ImageData>` |

### 输入与导出说明

普通图片来源会拉伸至输出尺寸；`ImageData` 按原始像素从左上角写入，不会缩放，超出画布部分被裁切。远程图片需要服务端允许跨域读取 canvas；设置 `crossOrigin` 本身不会绕过跨域限制。普通 URL 会追加时间戳参数，data URL 和 blob URL 保持原样。

组件没有插槽。

公开导出的类型包括 `ImageProcessorSource`、`ImageProcessorOutputSize`、`ImageProcessorOptions` 和 `ImageEnhancer`：

```ts
type ImageEnhancer = (
	imageData: ImageData,
	options?: ImageProcessorOptions
) => ImageData | void | Promise<ImageData | void>;
```
