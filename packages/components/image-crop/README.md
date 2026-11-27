## 图片裁剪（ImageCrop）

裁剪图片：拖动平移，滚轮或双指缩放，可旋转，可调整裁剪框；导出图片或原图像素坐标。

移动端入口导出的 `MImageCrop` 与 `ImageCrop` 的属性、事件、方法相同，交互改为触摸、尺寸按 750 稿缩放，`MImageCrop.open` 为全屏层，见 [移动端](#移动端)。

### 何时使用

上传前裁剪头像、封面，或需要把裁剪坐标交给后端处理原图时。

### 基础用法

裁剪框按 `aspectRatio` 适配舞台，图片始终铺满裁剪框：

- 拖动平移；滚轮缩放（以指针为中心）；
- 聚焦后方向键平移 10px（按住 Shift 为 1px），`+` / `-` 缩放。

`zoom` 为 1 时图片刚好铺满裁剪框，`maxZoom` 限制最大缩放；旋转时 `zoom` 不变，组件按新角度重新计算铺满所需的缩放。图片加载完成触发 `load`，失败触发 `error`；`getImage()` 导出图片，`reset()` 回到初始状态。

预览、交互期间不使用 canvas：图片与遮罩都是 DOM 和 CSS，只有导出时才绘制一次。

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
	<div class="image-crop-demo">
		<ImageCrop
			ref="target"
			v-model:zoom="zoom"
			v-model:rotate="rotate"
			:src="src"
			:aspect-ratio="16 / 9"
			:max-zoom="3"
			@load="handleLoad"
			@error="handleError"
		/>
		<div class="image-crop-demo__field">
			<span>缩放：{{ zoom.toFixed(2) }}</span>
			<Slider v-model="zoom" :min="1" :max="3" :step="0.01" />
		</div>
		<div class="image-crop-demo__field">
			<span>旋转：{{ rotate }}°</span>
			<Slider v-model="rotate" :min="-180" :max="180" />
		</div>
		<div class="image-crop-demo__row">
			<Button icon="rotate-left" aria-label="向左旋转" @click="handleRotate(-90)" />
			<Button icon="rotate-right" aria-label="向右旋转" @click="handleRotate(90)" />
			<Button @click="handleReset">还原</Button>
			<Button type="primary" :disabled="!isReady" @click="handleSave">导出</Button>
		</div>
		<p class="image-crop-demo__result">{{ status }}</p>
		<img v-if="result" :src="result" width="240" alt="裁剪结果">
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Button, ImageCrop, Slider } from '@deot/vc';

const src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
	<svg xmlns="http://www.w3.org/2000/svg" width="900" height="600">
		<rect width="900" height="600" fill="#8ecae6"/>
		<circle cx="690" cy="150" r="80" fill="#ffb703"/>
		<path d="M0 600V400L260 180L570 600Z" fill="#219ebc"/>
		<path d="M350 600L680 280L900 460V600Z" fill="#023047"/>
	</svg>
`);

const target = ref(null);
const zoom = ref(1);
const rotate = ref(0);
const result = ref('');
const isReady = ref(false);
const status = ref('加载中');

const handleLoad = () => {
	isReady.value = true;
	status.value = '图片已加载';
};

const handleError = () => {
	status.value = '图片加载失败';
};

const handleRotate = (value) => {
	rotate.value += value;
};

const handleReset = () => {
	target.value.reset();
};

const handleSave = async () => {
	try {
		const { dataURL } = await target.value.getImage({ width: 480, type: 'image/jpeg', quality: 0.9 });
		result.value = dataURL;
		status.value = '已导出 480 × 270 图片';
	} catch {
		status.value = '导出失败，请检查图片的跨域权限';
	}
};
</script>

<style scoped>
.image-crop-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
	max-width: 560px;
}

.image-crop-demo__field {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.image-crop-demo__row {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 8px;
}

.image-crop-demo__result {
	margin: 0;
}
</style>
```
:::

### 调整裁剪框与圆形遮罩

`resizable` 时可以拖动裁剪框的边和角调整大小：

- 拖动范围限制在舞台内边距以内，并且不会超出图片；
- 有 `aspectRatio` 时保持比例；`aspectRatio` 为 `null` 时不限比例，初始取图片的比例；
- 松开后，裁剪框回到适配舞台的大小并居中，图片随之放大，框内内容不变。

裁剪变化时触发 `change`，参数为原图像素下的裁剪数据。`shape="circle"` 只把遮罩画成圆形，导出的仍是矩形图片；`disabled` 禁用所有交互。

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
	<div class="image-crop-demo">
		<ImageCrop :src="src" :aspect-ratio="null" resizable @change="handleChange" />
		<p v-if="data" class="image-crop-demo__result">
			{{ data.width.toFixed(0) }} × {{ data.height.toFixed(0) }} @ ({{ data.x.toFixed(0) }}, {{ data.y.toFixed(0) }})
		</p>
		<div class="image-crop-demo__row">
			<Checkbox v-model="isDisabled">禁用</Checkbox>
		</div>
		<ImageCrop :src="src" shape="circle" :disabled="isDisabled" />
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Checkbox, ImageCrop } from '@deot/vc';

const src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
	<svg xmlns="http://www.w3.org/2000/svg" width="900" height="600">
		<rect width="900" height="600" fill="#8ecae6"/>
		<circle cx="450" cy="300" r="160" fill="#ffb703"/>
	</svg>
`);

const data = ref(null);
const isDisabled = ref(false);

const handleChange = (value) => {
	data.value = value;
};
</script>

<style scoped>
.image-crop-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
	max-width: 560px;
	--vc-image-crop-height: 280px;
}

.image-crop-demo__row {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
}

.image-crop-demo__result {
	margin: 0;
}
</style>
```
:::

### 在弹窗中裁剪（open）

`ImageCrop.open(options)` 在 Modal 中裁剪，下方有旋转按钮和缩放滑块。

- 参数包括裁剪属性（`src` 必填）、导出选项（同 `getImage`），以及 `title`、`okText`、`cancelText`。
- 确定后先导出，导出完成再关闭弹窗，`await` 得到 `{ dataURL, file?, data }`。确定、取消的默认文案同 Modal。
- 取消、关闭时拒绝。只用回调、不 `await` 时，取消不会产生未处理的拒绝。

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
	<div class="image-crop-demo">
		<Button @click="handleOpen">裁剪头像</Button>
		<img v-if="result" :src="result" width="96" alt="头像" class="image-crop-demo__avatar">
		<p class="image-crop-demo__result">{{ status }}</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Button, ImageCrop } from '@deot/vc';

const src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
	<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600">
		<rect width="600" height="600" fill="#f3f5f8"/>
		<circle cx="300" cy="260" r="150" fill="#456cf6"/>
	</svg>
`);

const result = ref('');
const status = ref('');

const handleOpen = async () => {
	try {
		const { dataURL } = await ImageCrop.open({
			src,
			shape: 'circle',
			width: 192,
			title: '裁剪头像',
			okText: '使用',
			cancelText: '放弃'
		});
		result.value = dataURL;
		status.value = '已裁剪';
	} catch {
		status.value = '已取消';
	}
};
</script>

<style scoped>
.image-crop-demo {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 16px;
}

.image-crop-demo__avatar {
	border-radius: 50%;
}

.image-crop-demo__result {
	margin: 0;
}
</style>
```
:::

### 裁剪数据（getData / setData）

`getData()` 返回原图像素下的 `{ x, y, width, height, rotate }`，`change` 事件的参数也是这个数据。它与 Cropper.js 的语义一致：

1. 先把原图按 `rotate` 顺时针旋转，画布扩展到旋转后的包围盒；
2. 再从这个画布上取 `(x, y, width, height)`。

后端用同样的顺序处理原图即可，比如 sharp 的 `rotate()` 加 `extract()`。`setData(data)` 用于恢复上一次的裁剪：

- 按宽度对齐当前裁剪框；
- 不限比例且 `resizable` 时，裁剪框改用数据的比例；
- 角度通过 `update:rotate` 写回。

`getCanvas()` 把裁剪结果同步画到 canvas，只传一边时另一边按比例。

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
	<div class="image-crop-demo">
		<ImageCrop ref="target" :src="src" :aspect-ratio="4 / 3" @update:rotate="handleRotate" />
		<div class="image-crop-demo__row">
			<Button @click="handleSave">记录 getData()</Button>
			<Button :disabled="!saved" @click="handleRestore">恢复 setData()</Button>
			<Button @click="handleCanvas">getCanvas()</Button>
		</div>
		<p class="image-crop-demo__result">记录：{{ saved ? JSON.stringify(saved) : '-' }}，update:rotate：{{ rotate }}°</p>
		<img v-if="preview" :src="preview" width="160" alt="画布预览">
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Button, ImageCrop } from '@deot/vc';

const src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
	<svg xmlns="http://www.w3.org/2000/svg" width="900" height="600">
		<rect width="900" height="600" fill="#8ecae6"/>
		<circle cx="690" cy="150" r="80" fill="#ffb703"/>
		<path d="M0 600V400L260 180L570 600Z" fill="#219ebc"/>
	</svg>
`);

const target = ref(null);
const saved = ref(null);
const rotate = ref(0);
const preview = ref('');

const handleRotate = (value) => {
	rotate.value = value;
};

const handleSave = () => {
	const data = target.value.getData();
	saved.value = data && {
		x: Math.round(data.x),
		y: Math.round(data.y),
		width: Math.round(data.width),
		height: Math.round(data.height),
		rotate: data.rotate
	};
};

const handleRestore = () => {
	target.value.setData(saved.value);
};

const handleCanvas = () => {
	const canvas = target.value.getCanvas({ width: 160 });
	preview.value = canvas ? canvas.toDataURL() : '';
};
</script>

<style scoped>
.image-crop-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
	max-width: 560px;
	--vc-image-crop-height: 280px;
}

.image-crop-demo__row {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 8px;
}

.image-crop-demo__result {
	margin: 0;
	word-break: break-all;
}
</style>
```
:::

## 移动端

`MImageCrop` 的属性、事件、方法和结构都与 `ImageCrop` 相同，根节点另有标记类 `.vcm-image-crop`。

- 交互：单指平移，双指缩放（以双指中心为锚点，跟随双指移动），不监听滚轮。
- 尺寸：按 750 稿设计，随 `--vc-rem` 缩放；底栏切换 `rem` 可查看不同屏宽下的效果。

:::playground
<!--
<config lang="json5">
{
	mobile: true
}
</config>
-->
```vue
<template>
	<div class="m-image-crop-demo">
		<MImageCrop
			ref="target"
			v-model:zoom="zoom"
			v-model:rotate="rotate"
			:src="src"
			:resizable="isResizable"
			:aspect-ratio="isResizable ? null : 1"
			@change="handleChange"
		/>
		<div class="m-image-crop-demo__controls">
			<MSlider v-model="zoom" :min="1" :max="4" :step="0.01" />
			<div class="m-image-crop-demo__row">
				<MButton size="small" @click="handleRotate">旋转</MButton>
				<MButton size="small" @click="handleReset">还原</MButton>
				<MButton size="small" @click="handleResizable">resizable: {{ isResizable }}</MButton>
				<MButton size="small" type="primary" @click="handleExport">导出</MButton>
			</div>
			<p v-if="data" class="m-image-crop-demo__result">
				{{ data.width.toFixed(0) }} × {{ data.height.toFixed(0) }} @ ({{ data.x.toFixed(0) }}, {{ data.y.toFixed(0) }})，{{ data.rotate }}°
			</p>
			<img v-if="result" :src="result" alt="裁剪结果" class="m-image-crop-demo__image">
		</div>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { MButton, MImageCrop, MSlider } from '@deot/vc';

const src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
	<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200">
		<rect width="900" height="1200" fill="#f3f5f8"/>
		<circle cx="450" cy="460" r="250" fill="#456cf6"/>
		<path d="M0 960 C180 860 300 960 450 860 C620 750 750 890 900 800 L900 1200 L0 1200 Z" fill="#52b788"/>
	</svg>
`);

const target = ref(null);
const zoom = ref(1);
const rotate = ref(0);
const isResizable = ref(false);
const data = ref(null);
const result = ref('');

const handleChange = (value) => {
	data.value = value;
};

const handleRotate = () => {
	rotate.value -= 90;
};

const handleReset = () => {
	target.value.reset();
};

const handleResizable = () => {
	isResizable.value = !isResizable.value;
};

const handleExport = async () => {
	const { dataURL } = await target.value.getImage({ width: 375 });
	result.value = dataURL;
};
</script>

<style scoped>
.m-image-crop-demo {
	display: flex;
	flex-direction: column;
	gap: calc(var(--vc-rem) * 32);
}

.m-image-crop-demo__controls {
	display: flex;
	flex-direction: column;
	gap: calc(var(--vc-rem) * 32);
	padding-inline: calc(var(--vc-rem) * 32);
}

.m-image-crop-demo__row {
	display: flex;
	flex-wrap: wrap;
	gap: calc(var(--vc-rem) * 16);
}

.m-image-crop-demo__result {
	margin: 0;
	font-size: calc(var(--vc-rem) * 26);
}

.m-image-crop-demo__image {
	width: calc(var(--vc-rem) * 320);
}
</style>
```
:::

### 全屏裁剪（MImageCrop.open）

`MImageCrop.open(options)` 打开全屏层：黑底，从底部滑入，裁剪区占满；底部为「取消 / 旋转 90° | 还原 / 确定」，取消、确定的默认文案同 MPicker。参数与结果同 `ImageCrop.open`，没有标题；传 `filename` 时结果带 `file`，可直接交给上传。

:::playground
<!--
<config lang="json5">
{
	mobile: true,
	local: false
}
</config>
-->
```vue
<template>
	<div class="m-image-crop-demo">
		<div class="m-image-crop-demo__row">
			<MButton size="small" type="primary" @click="handleOpen({ shape: 'circle', filename: 'avatar.png' })">圆形头像</MButton>
			<MButton size="small" @click="handleOpen({ aspectRatio: 16 / 9 })">16 : 9</MButton>
			<MButton size="small" @click="handleOpen({ aspectRatio: null, resizable: true })">自由裁剪</MButton>
		</div>
		<input type="file" accept="image/*" class="m-image-crop-demo__file" @change="handleFileChange">
		<p class="m-image-crop-demo__result">{{ status }}</p>
		<img v-if="result" :src="result" alt="裁剪结果" class="m-image-crop-demo__image">
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { MButton, MImageCrop } from '@deot/vc';

const src = ref('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
	<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200">
		<rect width="900" height="1200" fill="#f3f5f8"/>
		<circle cx="450" cy="460" r="250" fill="#456cf6"/>
		<path d="M0 960 C180 860 300 960 450 860 C620 750 750 890 900 800 L900 1200 L0 1200 Z" fill="#52b788"/>
	</svg>
`));

const status = ref('选择图片或直接使用示例图');
const result = ref('');

const handleFileChange = (event) => {
	const file = event.target.files?.[0];
	if (file) src.value = file;
	event.target.value = '';
};

const handleOpen = async (options) => {
	try {
		const { dataURL, file } = await MImageCrop.open({ src: src.value, width: 375, ...options });
		result.value = dataURL;
		status.value = file ? `已生成文件 ${file.name}` : '裁剪完成';
	} catch {
		status.value = '已取消';
	}
};
</script>

<style scoped>
.m-image-crop-demo {
	display: flex;
	flex-direction: column;
	gap: calc(var(--vc-rem) * 32);
	padding-inline: calc(var(--vc-rem) * 32);
}

.m-image-crop-demo__row {
	display: flex;
	flex-wrap: wrap;
	gap: calc(var(--vc-rem) * 16);
}

.m-image-crop-demo__file,
.m-image-crop-demo__result {
	margin: 0;
	font-size: calc(var(--vc-rem) * 26);
}

.m-image-crop-demo__image {
	width: calc(var(--vc-rem) * 320);
}
</style>
```
:::

| 项 | 移动端（括号内为 375 宽下的 px） | 桌面端 |
| --- | --- | --- |
| 舞台高度 | 750（375） | 360px |
| 内边距 | 32（16） | 24px |
| 舞台底色 | `#000` | 棋盘格（同 ColorPicker 的透明底） |
| 遮罩 | `rgb(0 0 0 / 60%)` | `rgb(0 0 0 / 50%)` |
| 手柄触控区 / 可见点 | 48（24）/ 16（8） | 16px / 8px |

## 主题与局部覆盖

单个组件通过 `--vc-image-crop-<键>` 覆盖。桌面端的默认值见下表，移动端在 `.vcm-image-crop` 上覆盖，与样式的加载顺序无关。

| 键 | 说明 | 桌面端默认值 |
| --- | --- | --- |
| `height` | 舞台高度；宽度随容器 | `360px` |
| `padding` | 裁剪框的活动范围到舞台边缘的距离 | `24px` |
| `background` | 舞台底色 | 棋盘格（同 ColorPicker 的透明底） |
| `mask` | 裁剪框外的遮罩 | `rgb(0 0 0 / 50%)` |
| `frame-color` | 裁剪框边线与手柄 | `rgb(255 255 255 / 80%)` |
| `handle-size` | 手柄的触控区 | `16px` |
| `handle-dot` | 手柄可见的点 | `8px` |

聚焦时的描边使用全局参数 `color-primary`。

## API

### 属性

`ImageCrop` 和 `MImageCrop` 使用相同属性。

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| src | 图片地址或文件；清空时移除图片 | `string \| Blob \| File` | - | - |
| aspectRatio | 裁剪框宽高比；`null` 为不限（`resizable` 时可自由调整，否则取图片比例） | `number \| null` | - | `1` |
| shape | 遮罩形状，导出仍为矩形 | `string` | `square`、`circle` | `square` |
| zoom | 缩放，`v-model:zoom`；1 为刚好铺满裁剪框（按当前角度） | `number` | - | `1` |
| maxZoom | 最大缩放 | `number` | - | `4` |
| rotate | 角度（顺时针），`v-model:rotate`；按钮一次转 90° 时有动画 | `number` | - | `0` |
| resizable | 可拖动边角调整裁剪框 | `boolean` | - | `false` |
| disabled | 禁用所有交互 | `boolean` | - | `false` |
| crossOrigin | 远程图片的跨域属性；只有远程地址会追加时间戳绕过缓存 | `string` | `''`、`anonymous`、`use-credentials` | `'anonymous'` |

### 事件

| 事件名 | 说明 | 回调参数 |
| --- | --- | --- |
| load | 图片加载完成 | `(image: HTMLImageElement) => void` |
| error | 图片加载失败 | `(error: Error) => void` |
| change | 裁剪变化：加载后、每次拖动 / 捏合 / 调整结束后、滚轮与键盘停下后、属性变化后 | `(data: { x, y, width, height, rotate }) => void` |
| update:zoom | 缩放变化 | `(zoom: number) => void` |
| update:rotate | 角度变化（`reset`、`setData`） | `(rotate: number) => void` |

### 方法

| 方法名 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| getData | 原图像素下的裁剪数据；图片未加载时为 `null` | - | `{ x, y, width, height, rotate } \| null` |
| setData | 恢复裁剪 | `data` | - |
| getCanvas | 裁剪结果画到 canvas；宽高都不传时为原图像素，只传一边时另一边按比例 | `{ width?, height?, fillColor? }` | `HTMLCanvasElement \| null` |
| getImage | 裁剪结果转为图片（`toBlob` 编码，不阻塞主线程）；传 `filename` 时同时生成 `File`；图片未加载时拒绝 | `{ width?, height?, fillColor?, type?, quality?, filename? }` | `Promise<{ dataURL, file? }>` |
| reset | 回到 `zoom` 1、角度 0，裁剪框重新适配 | - | - |

`getImage` 的 `type` 默认为 `image/png`，`quality` 用于 jpeg、webp。导出 jpeg 时，透明区域可以用 `fillColor` 填充。

### 静态方法

| 方法名 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| ImageCrop.open | 在 Modal 中裁剪 | 裁剪属性（除 `disabled`）+ 导出选项 + `title`、`okText`、`cancelText` | `Promise<{ dataURL, file?, data }>`，取消时拒绝 |
| MImageCrop.open | 全屏裁剪 | 同上（无 `title`） | 同上 |

### 使用注意

- 舞台宽度随容器，高度由 `--vc-image-crop-height` 控制；导出尺寸由 `getImage` / `getCanvas` 的参数决定。
- 远程图片需要服务端允许跨域，才能导出；设置 `crossOrigin` 本身不会授予跨域权限。
- 拖入文件不在组件内处理：用 Upload 取得文件后传给 `src`。
