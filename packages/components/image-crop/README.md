## 图片裁剪（ImageCrop）

基于 canvas 的图片裁剪组件，支持缩放、旋转、拖动定位、拖拽导入和导出图片。

### 何时使用

需要在上传前裁剪头像、调整封面比例，或通过拖动、缩放和旋转选择图片区域。

### 基础用法

通过 `scale`、`rotate` 和 `outputSize` 控制裁剪结果。

:::playground
<!-- <config lang="json5">{ previewInset: 16 }</config> -->
```vue
<template>
	<div class="crop-demo">
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
		/>
		<label>缩放：{{ scale }}<Slider v-model="scale" :min="1" :max="3" :step="0.01" /></label>
		<label>旋转：{{ rotate }}°<Slider v-model="rotate" :min="0" :max="360" /></label>
		<Button type="primary" :disabled="!isReady" @click="handleSave">
			预览裁剪结果
		</Button>
		<p>{{ status }}</p>
		<img v-if="result" :src="result" width="240" alt="裁剪结果">
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Button, ImageCrop, Slider } from '@deot/vc';

const target = ref(null);
const src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
	<svg xmlns="http://www.w3.org/2000/svg" width="900" height="600">
		<rect width="900" height="600" fill="#8ecae6"/>
		<circle cx="690" cy="150" r="80" fill="#ffb703"/>
		<path d="M0 600V400L260 180L570 600Z" fill="#219ebc"/>
		<path d="M350 600L680 280L900 460V600Z" fill="#023047"/>
	</svg>
`);
const scale = ref(1);
const rotate = ref(0);
const result = ref('');
const isReady = ref(false);
const status = ref('正在加载图片');

const handleSave = async () => {
	try {
		const { dataURL } = await target.value.getImage();
		result.value = dataURL;
		status.value = '已导出 750 × 500 图片';
	} catch {
		status.value = '导出失败，请检查图片的跨域权限';
	}
};

const handleImageLoad = () => {
	isReady.value = true;
	status.value = '拖动图片调整裁剪位置';
};
const handleImageError = () => {
	isReady.value = false;
	status.value = '图片加载失败';
};
</script>
<style scoped>
.crop-demo {
	display: grid;
	gap: 16px;
	max-width: 560px;
}

.crop-demo label {
	display: grid;
	gap: 8px;
}

.crop-demo img {
	max-width: 100%;
}

.crop-demo p {
	margin: 0;
}
</style>
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
| position | 相对图片的裁剪中心；传入后需通过 `position-change` 回写位置 | `{ x: number; y: number }` | - | 未传时内部中心为 `{ x: 0.5, y: 0.5 }` |
| maskColor | Canvas 遮罩颜色，字符串为 Canvas 支持的颜色，数组为 `[r, g, b, a]` | `string \| number[]` | - | `[0, 0, 0, 0.5]` |
| crossOrigin | 图片跨域属性 | `string` | `''`、`anonymous`、`use-credentials` | `'anonymous'` |
| droppable | 是否支持拖拽图片进入组件 | `boolean` | - | `true` |

`outputSize` 归一规则：

| 输入 | 输出 |
| --- | --- |
| `750` | `[750, 750]` |
| `[750]` | `[750, 750]` |
| `[750, 500]` | `[750, 500]` |

### 事件

| 事件名 | 说明 | 回调参数 | 参数说明 |
| --- | --- | --- | --- |
| image-load | 图片加载成功 | `(imageState) => void` | `{ resource, x, y, width, height }`；`resource` 为图片元素，宽高为适配裁剪比例后的尺寸，初始中心为 `0.5, 0.5` |
| image-error | 图片加载失败 | `(event) => void` | 图片或 FileReader 的错误事件 |
| image-change | 图片信息变化 | `(type) => void` | `'src'`、`'props'`、`'size'` 或 `'image'`，分别对应图片源、绘制属性、尺寸或内部图片状态变化 |
| image-drop | 接收到拖入内容，发生在加载完成前 | `(event) => void` | `DragEvent`；优先读取首个文件，否则读取 HTML 中的图片地址 |
| position-change | 拖动产生新中心位置 | `(position) => void` | `{ x, y }`，相对坐标；不是 `update:position` 事件 |
| mousemove | 鼠标或单指拖动移动 | `(event) => void` | `MouseEvent \| TouchEvent` |
| mouseup | 鼠标或单指拖动结束、触摸取消 | `(event) => void` | `MouseEvent \| TouchEvent` |

### 方法

| 方法名 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| refresh | 重新计算显示尺寸、画布尺寸并重绘 | - | `void` |
| getDimensions | 获取画布和显示尺寸 | - | `{ canvas: { width, height }, rotate, border, width, height }`；`canvas` 含两侧 border，外层宽高为显示尺寸 |
| getCroppingRect | 获取相对图片的裁剪矩形 | - | `{ x, y, width, height }`，为缩放及位置计算后的相对值，不是旋转后的包围盒 |
| getImageToCanvas | 按 `outputSize` 绘制裁剪图片 | - | `HTMLCanvasElement` |
| getImageScaledToCanvas | 以当前显示尺寸建立画布并绘制图片 | - | `HTMLCanvasElement` |
| getImage | 转换裁剪图片 | `options?: { isNormal?: boolean; filename?: string; getFile?: boolean }` | Promise，解析得到 `{ dataURL, file? }` |

`getImage` 默认参数为 `{ isNormal: true, filename: 'image', getFile: false }`。`isNormal: true` 使用 `getImageToCanvas()`；`false` 使用 `getImageScaledToCanvas()`，后者不保证与标准裁剪结果等比例缩放。`getFile: true` 时同时生成文件。组件还通过 ref 暴露 `canvas` 元素，挂载前不可用。

### 使用注意

- 通过 CSS `width` 控制显示大小，通过 `outputSize` 控制导出尺寸；不要用 canvas 的 HTML `width` / `height` 属性配置输出大小。
- `borderRadius` 只影响预览遮罩；导出仍是矩形画布，不包含遮罩。旋转或缩小图片时可能出现透明区域。
- 远程图片需允许相应的 CORS 请求才能导出；设置 `crossOrigin` 本身不会授予跨域权限。非 data URL 会追加时间戳查询参数。
- `droppable: false` 仅关闭拖入图片功能，仍可拖动已加载图片。清空 `src` 不会清除已加载的图片。
- `MImageCrop` 是 `ImageCrop` 的同一实现，属性、事件和方法相同；支持单指拖动，多指手势不执行缩放或旋转。
