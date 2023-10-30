## 图像处理（ImageProcessing）
图像处理(抠图、置灰、取色等等)

### 何时使用
需要去除图片的色彩，或者将图片置灰。

### 基础用法
通过设置`cutout-color`扣掉指定颜色，需要配合`processing`使用。

:::RUNTIME
```vue
<template>
	<div class="v-imgs-processing-basic">
		<h3>原图</h3>
		<img :src="img" width="100" height="100">
		<h3>扣掉指定颜色</h3>
		<ImageProcessing
			:value="img"
			:tolerance="90"
			:cutout-color="[255, 237, 113, 1]" 
			processing="cutout"
		/>
	</div>
</template>
<script setup lang="jsx">
import { ref } from 'vue';
import { ImageProcessing } from '@deot/vc';

const dataSource = ref('https://*/*.jpg');
</script>
```
:::

### 置灰
设置`processing`为gray

:::RUNTIME
```vue
<template>
	<div class="v-imgs-processing-basic">
		<h3>原图</h3>
		<img :src="image" width="100" height="100">
		<h3>置灰</h3>
		<ImageProcessing
			:value="image"
			processing="gray"
		/>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { ImageProcessing } from '@deot/vc';

const image = ref('https://github.githubassets.com/favicons/favicon.svg');
</script>
```
:::

## API

### 基础属性

| 属性          | 说明             | 类型                  | 可选值                       | 默认值          |
| ----------- | -------------- | ------------------- | ------------------------- | ------------ |
| value       | 图片的地址          | `string`            | -                         | -            |
| width       | 画布宽度           | `number`            | -                         | 100          |
| height      | 画布高度           | `number`            | -                         | 100          |
| processing  | 图片处理方式         | `string`、`Function` | `cutout`（扣掉颜色）、`gray`（置灰） | -            |
| cutoutColor | 要扣掉的颜色`rgba`格式 | `array`             | -                         | [0, 0, 0, 1] |
| tolerance   | 颜色的容差          | `number`            | -                         | 0            |
| crossOrigin | 解决图片跨域的问题      | `string`            | -                         | anonymous    |


