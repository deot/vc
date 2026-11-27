## 走马灯（Carousel）

在有限空间内轮播一组同级的图片、文字或卡片内容。

### 何时使用

- 需要依次展示一组同级内容时。
- 展示空间有限，需要通过自动播放或手动切换收纳内容时。
- 需要在桌面端或移动端提供横向、纵向或卡片式轮播时。

### 基础用法

`Carousel` 默认自动播放，`t` 设置切换间隔（毫秒）；`autoplay` 设为 `false` 时停止。实例方法 `previous`、`next` 在外部切换，激活项变化时触发 `change`。

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
		<div class="carousel-demo__row">
			<Button type="text" size="small" @click="handleToggleAutoplay">
				{{ isAutoplay ? '暂停自动播放' : '开始自动播放' }}
			</Button>
			<Button size="small" @click="handlePrevious">上一张</Button>
			<Button type="primary" size="small" @click="handleNext">下一张</Button>
		</div>
		<Carousel
			ref="carousel"
			:height="184"
			:t="4000"
			:autoplay="isAutoplay"
			@change="handleChange"
		>
			<CarouselItem v-for="(slide, index) in slides" :key="slide.title" :label="slide.title">
				<div class="carousel-demo__slide" :class="`is-${index + 1}`">
					<strong>{{ slide.title }}</strong>
					<span>{{ slide.description }}</span>
				</div>
			</CarouselItem>
		</Carousel>
		<p class="carousel-demo__result">第 {{ activeIndex + 1 }} / {{ slides.length }} 张</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Button, Carousel, CarouselItem } from '@deot/vc';

const carousel = ref();
const isAutoplay = ref(true);
const activeIndex = ref(0);
const slides = [
	{ title: '第一项', description: '轮播内容一的说明文字' },
	{ title: '第二项', description: '轮播内容二的说明文字' },
	{ title: '第三项', description: '轮播内容三的说明文字' },
	{ title: '第四项', description: '轮播内容四的说明文字' }
];

const handleChange = (index) => {
	activeIndex.value = index;
};

const handleToggleAutoplay = () => {
	isAutoplay.value = !isAutoplay.value;
};

const handlePrevious = () => {
	carousel.value.previous();
};

const handleNext = () => {
	carousel.value.next();
};
</script>

<style scoped>
.carousel-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.carousel-demo__row {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 8px;
}

.carousel-demo__slide {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 8px;
	height: 100%;
	color: #fff;
	background: linear-gradient(135deg, #536dfe, #8d9bff);
}

.carousel-demo__slide.is-2 {
	background: linear-gradient(135deg, #00897b, #48b9a9);
}

.carousel-demo__slide.is-3 {
	background: linear-gradient(135deg, #ef6c00, #f5a45b);
}

.carousel-demo__slide.is-4 {
	background: linear-gradient(135deg, #7b1fa2, #bd72d4);
}

.carousel-demo__result {
	margin: 0;
}
</style>
```
:::

### 指示器与箭头

`dots="outside"` 将指示器放到容器外，`stepper="always"` 让横向桌面轮播始终显示前后翻页按钮，两者都可以绑定布尔值 `false` 隐藏。`trigger` 设置桌面端指示器在悬停（`hover`）或点击（`click`）时切换；`initialIndex` 设置初始激活项；`setActiveItem` 按索引或 `name` 定位。

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
		<div class="carousel-demo__row">
			<RadioGroup v-model="trigger">
				<Radio value="hover">hover</Radio>
				<Radio value="click">click</Radio>
			</RadioGroup>
			<Button size="small" @click="handleGoTo('first')">第一项</Button>
			<Button size="small" @click="handleGoTo('second')">第二项</Button>
			<Button size="small" @click="handleGoTo(2)">索引 2</Button>
		</div>
		<Carousel
			ref="carousel"
			:height="180"
			:autoplay="false"
			:initial-index="1"
			:trigger="trigger"
			dots="outside"
			stepper="always"
		>
			<CarouselItem name="first" label="第一项">
				<div class="carousel-demo__slide">第一项：指示器带标签</div>
			</CarouselItem>
			<CarouselItem name="second" label="第二项">
				<div class="carousel-demo__slide is-2">第二项：初始激活</div>
			</CarouselItem>
			<CarouselItem name="third" label="第三项">
				<div class="carousel-demo__slide is-3">第三项：箭头始终可见</div>
			</CarouselItem>
		</Carousel>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Button, Carousel, CarouselItem, Radio, RadioGroup } from '@deot/vc';

const carousel = ref();
const trigger = ref('hover');

const handleGoTo = (target) => {
	carousel.value.setActiveItem(target);
};
</script>

<style scoped>
.carousel-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.carousel-demo__row {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 8px;
}

.carousel-demo__slide {
	display: flex;
	align-items: center;
	justify-content: center;
	height: 100%;
	color: #fff;
	background: linear-gradient(135deg, #536dfe, #8d9bff);
}

.carousel-demo__slide.is-2 {
	background: linear-gradient(135deg, #00897b, #48b9a9);
}

.carousel-demo__slide.is-3 {
	background: linear-gradient(135deg, #ef6c00, #f5a45b);
}
</style>
```
:::

### 垂直与卡片模式

`vertical` 改为纵向轮播；`card` 展示当前项及相邻项，只支持横向。卡片模式下 `CarouselItem` 的 `width` 设置卡片宽度，`scale` 设置非激活卡片的缩放比例。`loop` 为 `false` 时到首尾不再循环，`draggable` 为 `false` 时禁用鼠标拖拽与触摸滑动。

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
		<Carousel vertical :height="180" :autoplay="false" :loop="false" :draggable="false">
			<CarouselItem v-for="item in 4" :key="item">
				<div class="carousel-demo__slide" :class="{ 'is-even': item % 2 === 0 }">纵向 {{ item }}</div>
			</CarouselItem>
		</Carousel>
		<Carousel card :height="180" :autoplay="false">
			<CarouselItem v-for="item in 5" :key="item" width="60%" :scale="0.9">
				<div class="carousel-demo__slide" :class="{ 'is-even': item % 2 === 0 }">卡片 {{ item }}</div>
			</CarouselItem>
		</Carousel>
	</div>
</template>

<script setup>
import { Carousel, CarouselItem } from '@deot/vc';
</script>

<style scoped>
.carousel-demo {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
	gap: 16px;
}

.carousel-demo__slide {
	display: flex;
	align-items: center;
	justify-content: center;
	height: 100%;
	font-size: 20px;
	color: #fff;
	background: #7c94c3;
}

.carousel-demo__slide.is-even {
	background: #a6b6d5;
}
</style>
```
:::

### 带间距的滑动

非卡片模式下，为 `Carousel` 设置默认 `gap`，或为 `CarouselItem` 单独设置 `gap` 后可以露出相邻项；此时需要关闭 `loop`，且 `width` 应大于 `50%`。

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
	<Carousel class="carousel-demo" :height="180" :autoplay="false" :loop="false" :gap="16" dots="outside">
		<CarouselItem v-for="item in 4" :key="item" width="80%">
			<div class="carousel-demo__slide" :class="{ 'is-even': item % 2 === 0 }">{{ item }}</div>
		</CarouselItem>
	</Carousel>
</template>

<script setup>
import { Carousel, CarouselItem } from '@deot/vc';
</script>

<style scoped>
.carousel-demo__slide {
	display: flex;
	align-items: center;
	justify-content: center;
	height: 100%;
	font-size: 20px;
	color: #fff;
	background: #7c94c3;
}

.carousel-demo__slide.is-even {
	background: #a6b6d5;
}
</style>
```
:::

## 移动端

`MCarousel`、`MCarouselItem` 的属性、事件、插槽、方法与 `Carousel`、`CarouselItem` 相同。差异如下：

- 使用触摸滑动，不渲染前后翻页按钮，指示点只响应点击，因此 `stepper` 和 `trigger` 不改变移动端渲染行为。
- 默认隐藏指示点（`dots` 默认 `false`），并显示“当前项 / 总数”计数器（`indicator`，卡片模式下始终隐藏）；传入 `dots="bottom"` 可以同时显示指示点。
- 数字形式的 `height`、`gap` 为 750 稿长度，随 `--vc-rem` 缩放；字符串原样作为 CSS 长度。

下例依次展示带指示点与计数器的横向轮播、卡片模式与纵向轮播；底栏切换 `rem` 可查看不同屏宽下的效果。

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
	<div class="m-carousel-demo">
		<MCarousel :height="360" :autoplay="false" dots="bottom">
			<MCarouselItem v-for="item in 4" :key="item">
				<div class="m-carousel-demo__slide" :class="{ 'is-even': item % 2 === 0 }">{{ item }}</div>
			</MCarouselItem>
		</MCarousel>
		<MCarousel :height="320" :t="4000" card>
			<MCarouselItem v-for="item in 6" :key="item">
				<div class="m-carousel-demo__slide" :class="{ 'is-even': item % 2 === 0 }">卡片 {{ item }}</div>
			</MCarouselItem>
		</MCarousel>
		<MCarousel :height="320" :autoplay="false" :indicator="false" vertical dots="bottom">
			<MCarouselItem v-for="item in 3" :key="item">
				<div class="m-carousel-demo__slide" :class="{ 'is-even': item % 2 === 0 }">纵向 {{ item }}</div>
			</MCarouselItem>
		</MCarousel>
	</div>
</template>

<script setup>
import { MCarousel, MCarouselItem } from '@deot/vc';
</script>

<style scoped>
.m-carousel-demo {
	display: flex;
	flex-direction: column;
	gap: calc(var(--vc-rem) * 32);
}

.m-carousel-demo__slide {
	display: flex;
	align-items: center;
	justify-content: center;
	height: 100%;
	font-size: calc(var(--vc-rem) * 40);
	color: #fff;
	background: #7c94c3;
}

.m-carousel-demo__slide.is-even {
	background: #a6b6d5;
}
</style>
```
:::

### 带间距的滑动

`MCarouselItem` 的 `gap` 为 750 稿长度；`width` 可写成含 `--vc-rem` 的 CSS 长度，露出相邻项。与桌面端相同，需要关闭 `loop`。

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
	<MCarousel
		class="m-carousel-demo"
		:height="360"
		:autoplay="false"
		:loop="false"
		:indicator="false"
		dots="outside"
	>
		<MCarouselItem
			v-for="item in 4"
			:key="item"
			width="calc(100% - var(--vc-rem) * 144)"
			:gap="24"
		>
			<div class="m-carousel-demo__slide" :class="{ 'is-even': item % 2 === 0 }">{{ item }}</div>
		</MCarouselItem>
	</MCarousel>
</template>

<script setup>
import { MCarousel, MCarouselItem } from '@deot/vc';
</script>

<style scoped>
.m-carousel-demo__slide {
	display: flex;
	align-items: center;
	justify-content: center;
	height: 100%;
	font-size: calc(var(--vc-rem) * 40);
	color: #fff;
	background: #7c94c3;
}

.m-carousel-demo__slide.is-even {
	background: #a6b6d5;
}
</style>
```
:::

## 主题与局部覆盖

全局参数通过 `--vc-<参数>` 配置，单个组件通过 `--vc-carousel-<参数>` 覆盖。同一参数可能作用于多个状态；多命名空间时在使用位置中标明。

箭头、内置圆点、指示器文字及轮播项遮罩使用 color-contrast-light。⚠ color-mix：桌面箭头背景、悬停背景及移动端指示器背景由 color-contrast-dark 分别以 11%、23%、70% 与透明色混合。

透明色增强声明仅在 `@supports` 内生效；不支持 color-mix 时使用 Sass 编译的固定黑色 rgba() 降级值，透明度与上述比例一致，降级值不会随 color-contrast-dark 变量变化。

### 全局

| 参数 | 使用位置 | 值 |
| --- | --- | --- |
| color-contrast-dark | 桌面箭头及移动端指示器背景的派生基色 | `#000000`（亮暗主题相同） |
| color-contrast-light | 箭头、内置圆点、指示器文字及轮播项遮罩 | `#FFFFFF`（亮暗主题相同） |
| color-light-deepest | 桌面及移动端外置圆点 | 亮色：`#C0C4CC`；暗色：`#E8E8E8` |

### 局部

当前组件没有额外的局部 CSS 主题参数。

## API

### Carousel 与 MCarousel 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| t | 自动播放的切换间隔，单位为毫秒 | `number` | - | `3000` |
| card | 是否启用卡片模式 | `boolean` | - | `false` |
| gap | 轮播项的默认间距，MCarousel 中为 750 稿长度；`CarouselItem.gap` 或 `MCarouselItem.gap` 优先 | `number` | - | `0` |
| height | 内容区域高度；数字在 Carousel 中按 px、在 MCarousel 中为 750 稿长度，字符串原样作为 CSS 长度 | `string \| number` | - | - |
| initialIndex | 初始激活项索引，从 `0` 开始 | `number` | - | `0` |
| trigger | 桌面端指示器的切换方式 | `string` | `hover`、`click` | `hover` |
| autoplay | 是否自动切换 | `boolean` | - | `true` |
| dots | 指示点位置或是否隐藏指示点 | `string \| boolean` | `bottom`、`outside`、`false` | `Carousel: 'bottom'`；`MCarousel: false` |
| stepper | 桌面端横向轮播的前后翻页按钮显示方式 | `string \| boolean` | `hover`、`always`、`false` | `hover` |
| loop | 是否循环切换 | `boolean` | - | `true` |
| vertical | 是否使用纵向轮播 | `boolean` | - | `false` |
| draggable | 是否允许鼠标拖拽或触摸滑动切换 | `boolean` | - | `true` |
| indicator | 是否显示“当前项 / 总数”计数器，仅 `MCarousel` 支持；卡片模式下始终隐藏 | `boolean` | - | `true` |

`MCarousel` 不渲染前后翻页按钮，指示点只响应点击，因此 `stepper` 和 `trigger` 不改变移动端渲染行为。

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
| previous | 切换到上一项 | - | `void` |
| next | 切换到下一项 | - | `void` |

### CarouselItem 与 MCarouselItem 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| name | 轮播项名称，可供 `setActiveItem` 定位 | `string` | - | - |
| label | 对应指示器的文本。字符串按文本渲染，也可传渲染函数或 `{ type, value }`，见 [Customer](../customer/README.md) | `string \| number \| Function \| { type: string; value: any }` | - | `''` |
| width | 卡片宽度；非卡片模式下仅在存在 `gap` 时生效 | `string \| number` | - | `'70%'` |
| gap | 当前轮播项的间距，MCarouselItem 中为 750 稿长度 | `number` | - | `0` |
| scale | 非激活卡片的缩放比例 | `number` | - | `0.83` |

### CarouselItem 与 MCarouselItem 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 当前轮播项的内容 | - |

### 使用限制

- `card` 与 `vertical` 不能同时启用。
- 非卡片模式使用非零 `gap` 时必须将 `loop` 设为 `false`，否则组件会抛出异常。
- 非卡片模式中，`width` 只在存在非零 `gap` 时生效；当前位移算法要求宽度大于 `50%`。
