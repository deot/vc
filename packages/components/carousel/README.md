## 走马灯（Carousel）

在有限空间内轮播一组同级的图片、文字或卡片内容。

### 何时使用

- 需要依次展示一组同级内容时。
- 展示空间有限，需要通过自动播放或手动切换收纳内容时。
- 需要在桌面端或移动端提供横向、纵向或卡片式轮播时。

### 基础用法

`Carousel` 默认自动播放，桌面端指示器默认在悬停时切换；将 `autoplay` 设为 `false`、`trigger` 设为 `click` 后，仅在点击指示器时切换。

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
	<div class="carousel-demo">
		<section>
			<p>自动播放，悬停指示器切换</p>
			<Carousel :height="160">
				<CarouselItem v-for="item in 4" :key="item">
					<div class="slide" :class="{ 'is-even': item % 2 === 0 }">
						{{ item }}
					</div>
				</CarouselItem>
			</Carousel>
		</section>

		<section>
			<p>停止自动播放，点击指示器切换</p>
			<Carousel :height="160" :autoplay="false" trigger="click">
				<CarouselItem v-for="item in 4" :key="item">
					<div class="slide" :class="{ 'is-even': item % 2 === 0 }">
						{{ item }}
					</div>
				</CarouselItem>
			</Carousel>
		</section>
	</div>
</template>

<script setup>
import { Carousel, CarouselItem } from '@deot/vc';
</script>

<style scoped>
.carousel-demo {
	display: grid;
	gap: 24px;
}

.carousel-demo p {
	margin: 0 0 8px;
}

.slide {
	display: flex;
	height: 100%;
	align-items: center;
	justify-content: center;
	color: #fff;
	font-size: 20px;
	background: #7c94c3;
}

.slide.is-even {
	background: #a6b6d5;
}
</style>
```
:::

### 指示器与箭头

`dots="outside"` 将指示器放到容器外，`arrow="always"` 让横向桌面轮播始终显示切换箭头。两者都可以通过绑定布尔值 `false` 隐藏。

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
	<Carousel
		:height="180"
		:autoplay="false"
		dots="outside"
		arrow="always"
	>
		<CarouselItem v-for="item in 4" :key="item" :label="`第 ${item} 张`">
			<div class="slide" :class="{ 'is-even': item % 2 === 0 }">
				{{ item }}
			</div>
		</CarouselItem>
	</Carousel>
</template>

<script setup>
import { Carousel, CarouselItem } from '@deot/vc';
</script>

<style scoped>
.slide {
	display: flex;
	height: 100%;
	align-items: center;
	justify-content: center;
	color: #fff;
	font-size: 20px;
	background: #7c94c3;
}

.slide.is-even {
	background: #a6b6d5;
}
</style>
```
:::

### 垂直与卡片模式

`vertical` 改为纵向轮播；`card` 展示当前项及相邻项。卡片模式只支持横向。

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
	<div class="carousel-layout">
		<section>
			<p>垂直轮播</p>
			<Carousel vertical :height="180" :autoplay="false">
				<CarouselItem v-for="item in 4" :key="item">
					<div class="slide" :class="{ 'is-even': item % 2 === 0 }">
						{{ item }}
					</div>
				</CarouselItem>
			</Carousel>
		</section>

		<section>
			<p>卡片轮播</p>
			<Carousel card :height="180" :autoplay="false">
				<CarouselItem v-for="item in 5" :key="item">
					<div class="slide" :class="{ 'is-even': item % 2 === 0 }">
						{{ item }}
					</div>
				</CarouselItem>
			</Carousel>
		</section>
	</div>
</template>

<script setup>
import { Carousel, CarouselItem } from '@deot/vc';
</script>

<style scoped>
.carousel-layout {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 24px;
}

.carousel-layout p {
	margin: 0 0 8px;
}

.slide {
	display: flex;
	height: 100%;
	align-items: center;
	justify-content: center;
	color: #fff;
	font-size: 20px;
	background: #7c94c3;
}

.slide.is-even {
	background: #a6b6d5;
}
</style>
```
:::

### 移动端用法

`MCarousel` 使用触摸滑动，默认隐藏指示点并显示“当前项 / 总数”计数器。传入 `dots="bottom"` 可以同时显示指示点。

:::playground
<!--
<config lang="json5">
{
	viewport: [375, 667],
	viewportOptions: ['auto', 375, [375, 667]],
	previewInset: 16
}
</config>
-->
```vue
<template>
	<MCarousel :height="180" :autoplay="false" dots="bottom">
		<MCarouselItem v-for="item in 4" :key="item">
			<div class="slide" :class="{ 'is-even': item % 2 === 0 }">
				{{ item }}
			</div>
		</MCarouselItem>
	</MCarousel>
</template>

<script setup>
import { MCarousel, MCarouselItem } from '@deot/vc';
</script>

<style scoped>
.slide {
	display: flex;
	height: 100%;
	align-items: center;
	justify-content: center;
	color: #fff;
	font-size: 20px;
	background: #7c94c3;
}

.slide.is-even {
	background: #a6b6d5;
}
</style>
```
:::

### 带间距的滑动

非卡片模式下，为 `CarouselItem` 或 `MCarouselItem` 设置 `gutter` 后可以露出相邻项；此时需要关闭 `loop`，且 `width` 应大于 `50%`。

:::playground
<!--
<config lang="json5">
{
	viewport: [375, 667],
	viewportOptions: ['auto', 375, [375, 667]],
	previewInset: 16
}
</config>
-->
```vue
<template>
	<MCarousel
		:height="180"
		:autoplay="false"
		:loop="false"
		:indicator="false"
		dots="outside"
	>
		<MCarouselItem
			v-for="item in 4"
			:key="item"
			width="calc(100% - 72px)"
			:gutter="12"
		>
			<div class="slide" :class="{ 'is-even': item % 2 === 0 }">
				{{ item }}
			</div>
		</MCarouselItem>
	</MCarousel>
</template>

<script setup>
import { MCarousel, MCarouselItem } from '@deot/vc';
</script>

<style scoped>
.slide {
	display: flex;
	height: 100%;
	align-items: center;
	justify-content: center;
	color: #fff;
	font-size: 20px;
	background: #7c94c3;
}

.slide.is-even {
	background: #a6b6d5;
}
</style>
```
:::

## API

### Carousel 与 MCarousel 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| t | 自动播放的切换间隔，单位为毫秒 | `number` | - | `3000` |
| card | 是否启用卡片模式 | `boolean` | - | `false` |
| gutter | 轮播项的默认间距；`CarouselItem.gutter` 或 `MCarouselItem.gutter` 优先 | `number` | - | `0` |
| height | 内容区域高度，按 px 设置 | `string \| number` | - | - |
| initialIndex | 初始激活项索引，从 `0` 开始 | `number` | - | `0` |
| trigger | 桌面端指示器的切换方式 | `string` | `hover`、`click` | `hover` |
| autoplay | 是否自动切换 | `boolean` | - | `true` |
| dots | 指示点位置或是否隐藏指示点 | `string \| boolean` | `bottom`、`outside`、`false` | `Carousel: 'bottom'`；`MCarousel: false` |
| arrow | 桌面端横向轮播的箭头显示方式 | `string \| boolean` | `hover`、`always`、`false` | `hover` |
| loop | 是否循环切换 | `boolean` | - | `true` |
| vertical | 是否使用纵向轮播 | `boolean` | - | `false` |
| draggable | 是否允许鼠标拖拽或触摸滑动切换 | `boolean` | - | `true` |
| indicator | 是否显示“当前项 / 总数”计数器，仅 `MCarousel` 支持；卡片模式下始终隐藏 | `boolean` | - | `true` |

`MCarousel` 不渲染切换箭头，指示点只响应点击，因此 `arrow` 和 `trigger` 不改变移动端渲染行为。

### Carousel 与 MCarousel 事件

| 事件名 | 说明 | 回调参数 | 参数说明 |
| --- | --- | --- | --- |
| change | 激活项变化时触发 | `(activeIndex: number, oldIndex: number) => void` | `activeIndex` 为当前索引，`oldIndex` 为变化前的索引 |

### Carousel 与 MCarousel 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 放置 `CarouselItem` 或 `MCarouselItem` | - |

### Carousel 与 MCarousel 方法

通过组件 `ref` 调用以下方法。

| 方法名 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| setActiveItem | 切换到指定轮播项 | `index: number \| string`；传入索引或对应轮播项的 `name` | `void` |
| prev | 切换到上一项 | - | `void` |
| next | 切换到下一项 | - | `void` |

### CarouselItem 与 MCarouselItem 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| name | 轮播项名称，可供 `setActiveItem` 定位 | `string` | - | - |
| label | 对应指示器的文本 | `string \| number` | - | `''` |
| width | 卡片宽度；非卡片模式下仅在存在 `gutter` 时生效 | `string \| number` | - | `'70%'` |
| gutter | 当前轮播项的间距 | `number` | - | `0` |
| scale | 非激活卡片的缩放比例 | `number` | - | `0.83` |

### CarouselItem 与 MCarouselItem 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 当前轮播项的内容 | - |

### 使用限制

- `card` 与 `vertical` 不能同时启用。
- 非卡片模式使用非零 `gutter` 时必须将 `loop` 设为 `false`，否则组件会抛出异常。
- 非卡片模式中，`width` 只在存在非零 `gutter` 时生效；当前位移算法要求宽度大于 `50%`。
