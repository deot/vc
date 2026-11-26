## 图片（Image）

图片容器，支持懒加载、填充模式、加载占位、失败内容和预览。

移动端入口导出的 `MImage` 与 `Image` 是同一实现。

### 何时使用

- 图片需要懒加载时。
- 图片需要设置特定的填充方式时。
- 图片加载完成前需要占位，或加载失败需要替代内容时。

### 基础用法

通过 `fit` 指定图片在容器中的填充方式，取值与原生 `object-fit` 一致。`previewable` 默认开启，点击已加载的图片打开预览。

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
	<div class="image-demo">
		<div v-for="fit in fits" :key="fit" class="image-demo__item">
			<span>{{ fit }}</span>
			<Image :src="url" :fit="fit" class="image-demo__image" />
		</div>
	</div>
</template>

<script setup>
import { Image } from '@deot/vc';

const fits = ['fill', 'contain', 'cover', 'none', 'scale-down'];
const url = 'https://dummyimage.com/160x100/555/fff.png?text=Image';
</script>

<style scoped>
.image-demo {
	display: flex;
	flex-wrap: wrap;
	gap: 16px;
}

.image-demo__item {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 8px;
}

.image-demo__image {
	width: 100px;
	height: 100px;
	background: var(--vc-color-neutral-light);
}
</style>
```
:::

### 懒加载

设置 `lazy` 后，图片进入所在滚动容器的可视区时才会加载。滚动容器自动查找：从图片向上最近的滚动容器（包括 vc Scroller），都没有时为浏览器视口。

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
	<div class="image-demo">
		<Image
			v-for="(url, index) in urls"
			:key="index"
			:src="url"
			lazy
			class="image-demo__image"
		/>
	</div>
</template>

<script setup>
import { Image } from '@deot/vc';

const urls = [1, 2, 3, 4].map(index => `https://dummyimage.com/320x240/555/fff.png?text=Lazy+${index}`);
</script>

<style scoped>
.image-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
	height: 320px;
	overflow-y: auto;
}

.image-demo__image {
	flex-shrink: 0;
	width: 320px;
	max-width: 100%;
	height: 240px;
}
</style>
```
:::

### 缩略图、地址转换与预览

`thumbnail` 作为加载和显示用的缩略图，同时提供 `src` 时预览使用 `src`。`formatter` 在加载前转换地址，参数中的 `type` 区分 `src` 与 `thumbnail`，优先于全局配置。`previewable` 设为 `false` 时点击不打开预览。

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
	<div class="image-demo">
		<div class="image-demo__item">
			<span>thumbnail + src</span>
			<Image
				src="https://dummyimage.com/480x480/555/fff.png?text=Original"
				thumbnail="https://dummyimage.com/100x100/999/fff.png?text=Thumb"
				fit="cover"
				class="image-demo__image"
			/>
		</div>
		<div class="image-demo__item">
			<span>formatter</span>
			<Image src="Formatter" :formatter="handleFormat" class="image-demo__image" />
		</div>
		<div class="image-demo__item">
			<span>previewable: false</span>
			<Image
				src="https://dummyimage.com/100x100/555/fff.png?text=Image"
				:previewable="false"
				class="image-demo__image"
			/>
		</div>
	</div>
</template>

<script setup>
import { Image } from '@deot/vc';

const handleFormat = ({ value, type }) => {
	return `https://dummyimage.com/100x100/456cf6/fff.png?text=${value}+${type}`;
};
</script>

<style scoped>
.image-demo {
	display: flex;
	flex-wrap: wrap;
	gap: 16px;
}

.image-demo__item {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 8px;
}

.image-demo__image {
	width: 100px;
	height: 100px;
}
</style>
```
:::

### 加载占位与失败

`placeholder` 插槽替换加载前的占位内容，`error` 插槽替换失败内容；未提供 `error` 插槽时展示跟随当前 locale 的默认文案。`load`、`error` 事件依次接收原生事件、图片元素和组件实例。

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
	<div class="image-demo">
		<div class="image-demo__row">
			<Image
				:key="seed"
				:src="`https://dummyimage.com/200x200/555/fff.png?text=Load+${seed}`"
				class="image-demo__image"
				@load="handleLoad"
			>
				<template #placeholder>
					<span class="image-demo__slot">加载中…</span>
				</template>
			</Image>
			<Image
				src="https://example.invalid/image.png"
				class="image-demo__image"
				@error="handleError"
			>
				<template #error>
					<span class="image-demo__slot">图片不可用</span>
				</template>
			</Image>
			<Image src="https://example.invalid/default.png" class="image-demo__image" />
		</div>
		<div class="image-demo__row">
			<Button @click="handleReload">重新加载</Button>
		</div>
		<p class="image-demo__result">{{ loadText }}</p>
		<p class="image-demo__result">{{ errorText }}</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Button, Image } from '@deot/vc';

const seed = ref(1);
const loadText = ref('load：等待加载');
const errorText = ref('error：等待加载');

const handleLoad = (event, image) => {
	loadText.value = `load：${image.naturalWidth} × ${image.naturalHeight}`;
};

const handleError = (event) => {
	errorText.value = `error：${event.type}`;
};

const handleReload = () => {
	loadText.value = 'load：等待加载';
	seed.value++;
};
</script>

<style scoped>
.image-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.image-demo__row {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 8px;
}

.image-demo__image {
	width: 160px;
	height: 160px;
	background: var(--vc-color-neutral-light);
}

.image-demo__slot {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 100%;
	height: 100%;
	color: var(--vc-color-dark-extralight);
}

.image-demo__result {
	margin: 0;
}
</style>
```
:::

## 主题与局部覆盖

全局参数通过 `--vc-<参数>` 配置，组件级覆盖使用 `--vc-image-<参数>`。局部参数仅提供组件级入口；可在组件根节点或其祖先上设置。

内嵌或复用的 [file-preview](../file-preview/README.md#主题与局部覆盖) 使用各自的主题入口。

### 全局

| 参数 | 使用位置 | 值 |
| --- | --- | --- |
| color-dark-extralight | 加载失败文字 | 亮色：`#909399`；暗色：`#B9B9B9` |
| color-neutral-light | 加载占位底色 | 亮色：`#EDEFF1`；暗色：`#3B4354` |
| background-color-light | 加载占位的闪光亮带 | 亮色：`#F7F8FA`；暗色：`#2D3444` |

### 局部

加载占位与 [Skeleton](../skeleton/README.md#主题与局部覆盖) 共用同一套闪光，读取 Skeleton 的局部变量；设在祖先上时两者一并生效：

| 参数 | 使用位置 | 默认值 |
| --- | --- | --- |
| --vc-skeleton-color / --vc-skeleton-highlight-color | 占位底色 / 闪光亮带 | `color-neutral-light` / `background-color-light` |
| --vc-skeleton-duration | 闪光一次扫过的时长 | `1.4s` |

系统开启“减弱动态效果”时不闪光。

## API

### 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| src | 图片地址；未提供时使用 `thumbnail` | `string` | - | - |
| thumbnail | 加载和显示用的缩略图地址；提供 `src` 时预览仍使用 `src` | `string` | - | - |
| formatter | 转换图片地址，返回空值时沿用原地址；优先于全局 `VcInstance.configure({ Image: { formatter } })` 配置 | `(data: { value: string; type: 'src' \| 'thumbnail'; instance: object }) => string \| void` | - | - |
| fit | 图片如何适应容器，同原生 `object-fit` | `string` | `fill`、`contain`、`cover`、`none`、`scale-down` | - |
| lazy | 是否在进入所在滚动容器的可视区时才加载 | `boolean` | - | `false` |
| previewable | 点击已加载图片时是否打开预览；预览从这张图放大、关闭时缩回这张图 | `boolean` | - | `true` |


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
