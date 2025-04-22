## 图片裁剪（ImageCrop）
裁剪修改图片

### 何时使用
需要调整图片大小或旋转图片。

### 基础用法
通过控制`scale`、`rotate`调整图片的缩放和旋转角度。

:::RUNTIME
```vue
<template>
	<div>
		<ImageCrop
			ref="target"
			:src="src"
			:scale="scale"
			:rotate="rotate"
			:dest-width="375"
			:ratio="16 / 9"
			cross-origin="anonymous"
			@drop-file="handleDropFile"
			@load-failure="handleLoadFailure"
			@load-success="handleLoadSuccess"
			@image-ready="handleImageReady"
			@image-change="handleImageChange"
			@position-change="handlePositionChange"
		/>
		<Slider v-model="scale" :min="0.3" :max="3" :step="0.01" />
		<Slider v-model="rotate" :min="0" :max="360" />

		<div @click="handleSave">
			保存
		</div>

		<img :src="result" width="200">
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { ImageCrop, Slider } from '@deot/vc';

const src = ref('https://github.githubassets.com/favicons/favicon.svg');
const scale = ref(1);
const rotate = ref(0);
const result = ref(null);
const handleDropFile = (e) => {
	console.log('DropFile: ', e);
};

const handleLoadFailure = (e) => {
	console.log('LoadFailure: ', e);
};

const handleLoadSuccess = (imageState) => {
	console.log('LoadSuccess: ', imageState);
};

const handleImageReady = () => {
	console.log('ImageReady');
};

const handleImageChange = (src) => {
	console.log('ImageChange: ', src);
};

const handlePositionChange = (position) => {
	console.log('PositionChange: ', position);
};

const handleSave = async () => {
	try {
		const { file, base64Image } = await target.value.getImage();
		result.value = base64Image;
	} catch (e) {
		console.log(e, '跨域问题：需要添加 cors协议头');
	}
};
</script>
```
:::

## API

### 属性

| 属性           | 说明           | 类型                       | 可选值                           | 默认值              |
| ------------ | ------------ | ------------------------ | ----------------------------- | ---------------- |
| src          | 图片地址         | `string`、`object`、`File` | -                             | -                |
| scale        | 缩放值          | `number`                 | -                             | `1`              |
| rotate       | 旋转角度         | `number`                 | -                             | `0`              |
| border       | 裁剪的边框 [x, y] | `number`、`array`         | -                             | `20`             |
| borderRadius | 裁剪的边框圆角      | `number`                 | -                             | `0`              |
| destWidth    | 裁剪区域宽        | `number`                 | -                             | `750`            |
| ratio        | 裁剪比例         | `number`                 | -                             | `1`              |
| position     | 裁剪区域定位       | `object`                 | -                             | -                |
| color        | 边框的背景色RGBA   | `array`                  | -                             | `[0, 0, 0, 0.5]` |
| cross-origin | 跨域来源         | `string`                 | `anonymous`、`use-credentials` | `anonymous`      |
| disableDrop  | 是否支持拖拽图片进来编辑 | `Boolean`                | -                             | `false`          |


### 事件

| 事件名             | 说明           | 回调参数                             | 参数说明               |
| --------------- | ------------ | -------------------------------- | ------------------ |
| drop-file       | 拖入图片回掉       | `(e: Event) => void 0`           | `e`: 事件对象          |
| load-fail       | 图片加载失败       | -                                | -                  |
| load-success    | 图片加载成功       | `(imageState: object) => void 0` | `imageState`: 图片对象 |
| image-ready     | 图片加载成功，展示后执行 | -                                | -                  |
| image-change    | 图片信息变化       | -                                | -                  |
| position-change | 位置变化         | `(position: object) => void 0`   | `position`: 定位信息   |


### 方法

| 方法名                    | 说明                                             | 参数                                                                                                                                                                                                  |
| ---------------------- | ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| getImageToCanvas       | 基于原图绘制，返回一个HTMLCanvasElement，在另一个画布上绘制，或添加到DOM | -                                                                                                                                                                                                   |
| getImageScaledToCanvas | 基于当前画布大小绘制，返回一个HTMLCanvasElement               | -                                                                                                                                                                                                   |
| getImage               | 获取当前裁剪的图片对象                                    | `opts`：配置对象；默认为：`{ isNormal = true, filename = 'image', getFile = false }`; `isNormal`: 为`true`时采用`getImageToCanvas`方法否则采用`getImageScaledToCanvas`方法获取`canvas`; `filename`：文件名；`getFile`：是否获取图片文件对象 |
