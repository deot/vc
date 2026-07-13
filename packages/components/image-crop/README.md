## 图片裁剪（ImageCrop）

基于 canvas 的图片裁剪组件，支持缩放、旋转、拖动定位、拖拽导入和导出图片。

### 何时使用

需要调整图片大小或旋转图片。

### 基础用法

通过 `scale`、`rotate` 和 `outputSize` 控制裁剪结果。

:::RUNTIME
```vue
<template>
	<div>
		<ImageCrop
			ref="target"
			:src="src"
			:scale="scale"
			:rotate="rotate"
			:output-size="[750, 500]"
			:border="40"
			cross-origin="anonymous"
			style="width: 100%;"
			@image-load="handleImageLoad"
			@image-error="handleImageError"
			@image-drop="handleImageDrop"
			@image-change="handleImageChange"
			@position-change="handlePositionChange"
		/>
		<Slider v-model="scale" :min="0.3" :max="3" :step="0.01" />
		<Slider v-model="rotate" :min="0" :max="360" />
		<Button type="primary" @click="handleSave">
			保存
		</Button>
		<img v-if="result" :src="result" width="240">
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Button, ImageCrop, Slider } from '@deot/vc';

const target = ref(null);
const src = ref('data:image/svg+xml;charset=utf-8,...');
const scale = ref(1);
const rotate = ref(0);
const result = ref('');

const handleSave = async () => {
	const { dataURL, file } = await target.value.getImage({
		filename: 'image-crop',
		getFile: true
	});

	result.value = dataURL;
};

const handleImageLoad = image => image;
const handleImageError = event => event;
const handleImageDrop = event => event;
const handleImageChange = type => type;
const handlePositionChange = position => position;
</script>
```
:::

## API

### 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| src | 图片地址或图片文件 | `string \| Blob \| File` | - | - |
| scale | 缩放值 | `number` | - | `1` |
| rotate | 旋转角度 | `number` | - | `0` |
| border | 裁剪遮罩边框，数组为 `[x, y]` | `number \| number[]` | - | `20` |
| borderRadius | 裁剪区域圆角 | `number` | - | `0` |
| outputSize | 输出图片尺寸 | `number \| [number] \| [number, number]` | - | `750` |
| position | 裁剪定位 | `{ x: number; y: number }` | - | - |
| maskColor | 遮罩颜色 | `string \| number[]` | - | `[0, 0, 0, 0.5]` |
| cross-origin | 图片跨域属性 | `string` | `''`、`anonymous`、`use-credentials` | `anonymous` |
| droppable | 是否支持拖拽图片进入组件 | `boolean` | - | `true` |

`outputSize` 归一规则：

| 输入 | 输出 |
| --- | --- |
| `750` | `[750, 750]` |
| `[750]` | `[750, 750]` |
| `[750, 500]` | `[750, 500]` |

### 事件

| 事件名 | 说明 | 回调参数 |
| --- | --- | --- |
| image-load | 图片加载成功 | `(imageState) => void` |
| image-error | 图片加载失败 | `(event) => void` |
| image-change | 图片信息变化 | `(type) => void` |
| image-drop | 拖入图片 | `(event) => void` |
| position-change | 位置变化 | `(position) => void` |
| mousemove | 拖动移动 | `(event) => void` |
| mouseup | 拖动结束 | `(event) => void` |

### 方法

| 方法名 | 说明 | 参数 |
| --- | --- | --- |
| getDimensions | 获取当前 canvas 尺寸信息 | - |
| getCroppingRect | 获取裁剪区域相对坐标 | - |
| getImageToCanvas | 基于原图绘制，返回 `HTMLCanvasElement` | - |
| getImageScaledToCanvas | 基于当前画布显示尺寸绘制，返回 `HTMLCanvasElement` | - |
| getImage | 获取裁剪图片 | `opts`，默认 `{ isNormal: true, filename: 'image', getFile: false }` |

`getImage` 使用 `canvasToImage` 转换，返回 `{ dataURL, file? }`。
