## 走马灯（Carousel）

在有限空间内，循环播放同一类型的图片、文字等内容

### 何时使用

- 当有一组平级的内容。
- 当内容空间不足时，可以用走马灯的形式进行收纳，进行轮播展现。
- 常用于一组图片或卡片轮播。

### 基础用法

默认是自动播放，并且`hover`切换

:::RUNTIME
```vue
<template>
	<div class="v-carousel-basic">
		<p>自动切换，默认Hover切换</p>
		<Carousel :height="150">
			<CarouselItem v-for="item in 4" :key="item">
				<h3>{{ item }}</h3>
			</CarouselItem>
		</Carousel>
		<p style="margin-top: 10px">不自动切换，Click指示器切换</p>
		<Carousel 
			:autoplay="false" 
			trigger="click" 
			:height="150"
		>
			<CarouselItem v-for="item in 4" :key="item">
				<h3>{{ item }}</h3>
			</CarouselItem>
		</Carousel>
	</div>
</template>
<script setup>
import { Carousel, CarouselItem } from '@deot/vc'
</script>
<style>
.v-carousel-basic .CarouselItem h3{
	color: #475669;
	font-size: 14px;
	opacity: 0.75; 
	line-height: 150px;
	margin: 0;
	text-align: center;
}
.v-carousel-basic .vc-carousel-item:nth-child(2n) {
	background-color: #99a9bf;
}
.v-carousel-basic .vc-carousel-item:nth-child(2n+1) {
	background-color: #d3dce6;
}
</style>
```
:::

### 指示器
通过`dots`控制指示器

:::RUNTIME
```vue
<template>
	<div class="v-carousel-basic">
		<p>隐藏指示器</p>
		<Carousel :dots="false" :height="150">
			<CarouselItem v-for="item in 4" :key="item">
				<h3>{{ item }}</h3>
			</CarouselItem>
		</Carousel>
		<p style="margin-top: 10px">指示器在容器外显示</p>
		<Carousel dots="outside" :height="150">
			<CarouselItem v-for="item in 4" :key="item">
				<h3>{{ item }}</h3>
			</CarouselItem>
		</Carousel>
	</div>
</template>
<script setup>
import { Carousel, CarouselItem } from '@deot/vc'
</script>
<style>
.v-carousel-basic li{
	margin-top: 0 !important; 
	list-style: none;
}
.v-carousel-basic .CarouselItem h3{
	color: #475669;
	font-size: 14px;
	opacity: 0.75; 
	line-height: 150px;
	margin: 0;
	text-align: center;
}
.v-carousel-basic .vc-carousel-item:nth-child(2n) {
	background-color: #99a9bf;
}

.v-carousel-basic .vc-carousel-item:nth-child(2n+1) {
	background-color: #d3dce6;
}
</style>
```
:::

### 切换箭头
`arrow`属性定义了切换箭头的显示时机。默认情况下，切换箭头只有在鼠标`hover`到走马灯上时才会显示；若将`arrow`设置为`always`，则会一直显示；设置为`false`，则会一直隐藏。（注意：设置为`false`时需要使用v-bind）

:::RUNTIME
```vue
<template>
	<div class="v-carousel-basic">
		<p>隐藏切换箭头</p>
		<Carousel :arrow="false" :height="150">
			<CarouselItem v-for="item in 4" :key="item">
				<h3>{{ item }}</h3>
			</CarouselItem>
		</Carousel>
		<p style="margin-top: 10px">箭头一直显示</p>
		<Carousel arrow="always" :height="150">
			<CarouselItem v-for="item in 4" :key="item">
				<h3>{{ item }}</h3>
			</CarouselItem>
		</Carousel>
	</div>
</template>
<script setup>
import { Carousel, CarouselItem } from '@deot/vc'
</script>
```
:::

### 垂直方向的走马灯
通过设置`vertical`来让走马灯在垂直方向上显示。

:::RUNTIME
```vue
<template>
	<div class="v-carousel-basic">
		<Carousel vertical :height="150">
			<CarouselItem v-for="item in 4" :key="item">
				<h3>{{ item }}</h3>
			</CarouselItem>
		</Carousel>
	</div>
</template>
<script setup>
import { Carousel, CarouselItem } from '@deot/vc'
</script>
<style>
</style>
```
:::

### 卡片化
当页面宽度方向空间空余，但高度方向空间匮乏时，可使用卡片风格。

:::RUNTIME
```vue
<template>
	<div class="v-carousel-basic">
		<Carousel card :height="150">
			<CarouselItem v-for="item in 4" :key="item">
				<h3>{{ item }}</h3>
			</CarouselItem>
		</Carousel>
	</div>
</template>
<script setup>
import { Carousel, CarouselItem } from '@deot/vc'
</script>
<style>
</style>
```
:::

### H5基础用法

:::RUNTIME
```vue
<template>
	<div class="v-carousel-basic">
		<MCarousel :height="150" :autoplay="true" dots="bottom">
			<MCarouselItem v-for="item in 4" :key="item">
				<h3>{{ item }}</h3>
			</MCarouselItem>
		</MCarousel>
	</div>
</template>
<script setup>
import { MCarousel, MCarouselItem } from '@deot/vc'
</script>
<style>
.v-carousel-basic .MCarouselItem h3{
	color: #475669;
	font-size: 14px;
	opacity: 0.75; 
	line-height: 150px;
	margin: 0;
	text-align: center;
}

.v-carousel-basic .vcm-carousel-item:nth-child(2n) {
	background-color: #99a9bf;
}

.v-carousel-basic .vcm-carousel-item:nth-child(2n+1) {
	background-color: #d3dce6;
}
</style>
```
:::

### H5卡片

:::RUNTIME
```vue
<template>
	<div class="v-carousel-basic">
		<MCarousel :t="4" :height="200" card>
			<MCarouselItem v-for="item in 6" :key="item">
				<h3 class="medium">
					{{ item }}
				</h3>
			</MCarouselItem>
		</MCarousel>
	</div>
</template>
<script setup>
import { MCarousel, MCarouselItem } from '@deot/vc'
</script>
```
:::

### H5垂直走马灯

:::RUNTIME
```vue
<template>
	<div class="v-carousel-basic">
		<MCarousel :autoplay="false" :height="200" vertical dots="bottom">
			<MCarouselItem v-for="item in 3" :key="item">
				<h3 class="medium">
					{{ item }}
				</h3>
			</MCarouselItem>
		</MCarousel>
	</div>
</template>
<script setup>
import { MCarousel, MCarouselItem } from '@deot/vc'
</script>
```
:::

## API

### 基础属性
| 属性           | 说明                   | 类型                 | 可选值                        | 默认值     |
| ------------ | -------------------- | ------------------ | -------------------------- | ------- |
| t            | 幻灯片切换的时间间隔           | `number`           | -                          | 3       |
| height       | -                    | `string`、`number`  | -                          | -       |
| initialIndex | 初始状态激活的幻灯片的索引，从 0 开始 | `number`           | -                          | 0       |
| trigger      | -                    | `string`           | `hover`、`click`            | `hover` |
| autoplay     | 是否自动切换               | `boolean`          | -                          | `true`  |
| dots         | 是否展示指示器、是否在显示在容器外部   | `string`、`boolean` | `outside`、`bottom`、`false` | true    |
| arrow        | -                    | `string`、`boolean` | `hover`、`always`、`false`   | `hover` |
| loop         | 是否循环显示               | `boolean`          | -                          | `true`  |
| vertical     | 是否垂直                 | `boolean`          | -                          | `false` |
| draggable    | 是否可以拖拽切换             | `boolean`          | -                          | `true`  |


### Carousel-Item属性

| 属性     | 说明            | 类型                | 可选值 | 默认值  |
| ------ | ------------- | ----------------- | --- | ---- |
| name   | 幻灯片的名字        | `string`          | -   | -    |
| label  | 该幻灯片所对应指示器的文本 | `string`、`number` | -   | -    |
| width  | 卡片形式的大小       | `number`、`string` | -   | 70%  |
| gutter | 卡片之间的间距       | `number`          | -   | 0    |
| scale  | 卡片的缩放         | `number`          | -   | 0.83 |


### 事件

| 事件名    | 说明       | 回调参数                              | 参数说明                            |
| ------ | -------- | --------------------------------- | ------------------------------- |
| change | 幻灯片切换时触发 | `(activeIndex: number) => void 0` | `activeIndex`：目前激活的幻灯片索引，原幻灯片索引 |


### 方法

| 方法名           | 说明        | 参数                                              |
| ------------- | --------- | ----------------------------------------------- |
| setActiveItem | 手动切换幻灯片   | 需要切换的幻灯片的索引，从 0 开始；或相应 `CarouselItem`的`name`属性值 |
| prev          | 切换至上一张幻灯片 | -                                               |
| next          | 切换至下一张幻灯片 | -                                               |
