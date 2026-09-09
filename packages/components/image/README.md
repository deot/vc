## 图片（Image）
图片容器，支持懒加载、填充模式、加载占位、失败内容和预览。

### 何时使用

- 图片需要懒加载时。
- 图片需要设置特定的填充方式时。
- 图片加载完成前需要占位时。

### 基础用法

通过 `fit` 指定图片在容器中的填充方式，取值与原生 `object-fit` 一致。

:::playground
```vue
<template>
	<div class="v-img-basic" style="padding: 10px;">
		<div v-for="fit in fits" :key="fit" class="_img-wrap">
			<span style="margin-bottom: 10px;">{{ fit }}</span>
			<Image :src="url" :fit="fit" style="width: 100px; height: 100px" />
		</div>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Image } from '@deot/vc';

const fits = ref(['fill', 'contain', 'cover', 'none', 'scale-down']);
const url = ref('https://github.githubassets.com/favicons/favicon.svg');

</script>
<style>
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

:::playground
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

const urls = ref([
	'https://github.githubassets.com/favicons/favicon.svg',
	'https://github.githubassets.com/favicons/favicon.svg',
	'https://github.githubassets.com/favicons/favicon.svg'
]);
</script>
```
:::

### 加载失败
图片加载失败时展示跟随当前 locale 的默认文案；可通过 `error` 插槽自定义内容。

:::playground
```vue
<template>
	<div style="text-align: center;">
		<Image
			src="https://example.invalid/image.png"
			style="width: 200px; height: 200px; background: #f6f8fa;"
		/>
	</div>
</template>

<script setup>
import { Image } from '@deot/vc';

</script>
```
:::

## API

### 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| src | 图片地址；未提供时使用 `thumbnail` | `string` | - | - |
| thumbnail | 加载和显示用的缩略图地址；提供 `src` 时预览仍使用 `src` | `string` | - | - |
| formatter | 转换图片地址，优先于全局 `VcInstance.configure({ Image: { formatter } })` 配置 | `(path: string, type: 'src' \| 'thumbnail', instance: object) => string` | - | - |
| fit | 图片如何适应容器，同原生 `object-fit` | `string` | `fill`、`contain`、`cover`、`none`、`scale-down` | - |
| lazy | 是否在滚动容器中延迟加载 | `boolean` | - | `false` |
| wrapper | 懒加载时使用的滚动容器元素或选择器；未提供时自动查找 | `HTMLElement \| string` | - | - |
| previewable | 点击已加载图片时是否打开预览 | `boolean` | - | `true` |


### 事件

| 事件名 | 说明 | 回调参数 | 参数说明 |
| --- | --- | --- | --- |
| load | 图片加载成功时触发 | `(event: Event, image: HTMLImageElement, instance: object) => void` | `event` 为原生加载事件；`image` 为当前创建的图片元素；`instance` 为组件实例 |
| error | 图片加载失败时触发 | `(event: Event, image: HTMLImageElement, instance: object) => void` | `event` 为原生失败事件；`image` 为当前创建的图片元素；`instance` 为组件实例 |


### 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| placeholder | 图片未加载的占位内容 | - |
| error | 图片加载失败时的内容 | - |
