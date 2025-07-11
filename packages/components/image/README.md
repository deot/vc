## 图片（Image）
图片容器，在保留原生img的特性下，支持懒加载，自定义占位、加载失败等

### 何时使用

- 图片需要懒加载时。
- 图片需要设置特定的填充方式时。
- 图片加载完成前需要占位时。

### 基础用法

fit的5种模式
- fill：被替换的内容正好填充元素的内容框。整个对象将完全填充此框。如果对象的宽高比与内容框不相匹配，那么该对象将被拉伸以适应内容框。
- contain：被替换的内容将被缩放，以在填充元素的内容框时保持其宽高比。 整个对象在填充盒子的同时保留其长宽比，因此如果宽高比与框的宽高比不匹配，该对象将被添加“黑边”。
- cover：被替换的内容在保持其宽高比的同时填充元素的整个内容框。如果对象的宽高比与内容框不相匹配，该对象将被剪裁以适应内容框。
- none：被替换的内容将保持其原有的尺寸。
- scale-down：内容的尺寸与 none 或 contain 中的一个相同，取决于它们两个之间谁得到的对象尺寸会更小一些。

:::RUNTIME
```vue
<template>
	<div class="v-img-basic" style="padding: 10px;">
		<div v-for="fit in fits" :key="fit" class="_img-wrap">
			<span style="margin-bottom: 10px;">{{ fit }}</span>
			<Image :src="url" :fit="fit" @load="handleLoad" style="width: 100px; height: 100px" />
		</div>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Image } from '@deot/vc';

const fits = ref(['fill', 'contain', 'cover', 'none', 'scale-down']);
const url = ref('https://github.githubassets.com/favicons/favicon.svg');

const handleLoad = (e, img, instance) => {
	console.log('load');
	console.log(e);
	console.log(img);
	console.log(instance);
};
</script>
<style lang="scss">
.v-img-basic {
	display: flex;
}
.v-img-basic ._img-wrap {
	display: flex;
	flex: 1;
	align-items: center;
	flex-direction: column;
}
</style>
```
:::

### 懒加载
通过设置`lazy`属性设置懒加载，当页面滚动到图片区域时才会加载该图片。

:::RUNTIME
```vue
<template>
	<div class="v-img-lazy" style="padding: 10px;">
		<div style="height: 400px; overflow-y: auto; display: flex; flex-direction: column; width: 100%">
			<!-- hack 边距 -->
			<div v-for="url in urls" :key="url" style="font-size: 0">
				<Image
					:src="url"
					lazy
					style="min-height: 400px; width: 400px; height: 400px"
				/>
			</div>
		</div>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Image } from '@deot/vc';

const show = ref(false);
const urls = ref([
	'https://github.githubassets.com/favicons/favicon.svg',
	'https://github.githubassets.com/favicons/favicon.svg',
	'https://github.githubassets.com/favicons/favicon.svg'
]);
</script>
<style>
</style>
```
:::

### 加载失败
图片加载失败时展示加载失败文案。

:::RUNTIME
```vue
<template>
	<div style="text-align: center;">
		<Image
			src="https://github.githubassets.com/favicons/favicon.svg"
			lazy
			@error="handleError"
			style="width: 200px; height: 200px; background: #f6f8fa;"
		/>
	</div>
</template>

<script setup>
import { Image } from '@deot/vc';

const handleError = (e, img, instance) => {
	console.log('error');
	console.log(e);
	console.log(img);
	console.log(instance);
};
</script>
```
:::

## API

### 属性

| 属性      | 说明                         | 类型                 | 可选值                                          | 默认值     |
| ------- | -------------------------- | ------------------ | -------------------------------------------- | ------- |
| src     | 图片资源                       | `string`           | -                                            | -       |
| fit     | 确定图片如何适应容器框，同原生 object-fit | `string`           | `fill`、`contain`、`cover`、`none`、`scale-down` | -       |
| lazy    | 是否开启懒加载                    | `boolean`          | -                                            | `false` |
| wrapper | 父容器                        | `object`、 `string` | -                                            | -       |
| previewable | 可预览                        | `boolean` | -                                            | true       |


### 事件

| 事件名   | 说明       | 回调参数                                                  | 参数说明                                                |
| ----- | -------- | ----------------------------------------------------- | --------------------------------------------------- |
| load  | 图片加载成功触发 | `(e: Event, img: object, instance: object) => void 0` | `e`：img加载失败事件对象；`img`：当前生成的imgDOM对象；`instance`：组件实例 |
| error | 图片加载失败触发 | `(e: Event, img: object, instance: object) => void 0` | `e`：img加载失败事件对象；`img`：当前生成的imgDOM对象；`instance`：组件实例 |


### Slot

| 属性          | 说明         |
| ----------- | ---------- |
| placeholder | 图片未加载的占位内容 |
| error       | 加载失败的内容    |


## TODO
1. 自动计算高度（width.isRequired）
2. 管理资源宽高
3. cover/fit等效果
4. 自动压缩展示的图片
