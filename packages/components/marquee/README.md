## 文字轮播（Marquee）

在固定宽度区域内从右向左循环滚动内容。

移动端入口导出的 `MMarquee` 与 `Marquee` 的属性、事件和插槽相同，首尾间距按 750 稿随 `--vc-rem` 缩放，见 [移动端](#移动端)。

### 何时使用

在一小块内容展示通知类的信息时使用。

### 基础用法

支持 `content` 和默认插槽，插槽优先。内容超出容器时滚动，两份内容首尾相接无缝循环；未超出时静止显示。

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
	<div class="marquee-demo">
		<Marquee class="marquee-demo__item">
			<span>{{ text }}</span>
		</Marquee>
		<Marquee :content="text" class="marquee-demo__item" />
		<Marquee :content="text.repeat(3)" class="marquee-demo__item" />
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Marquee } from '@deot/vc';

const text = ref('ABCDEFG ');
</script>

<style scoped>
.marquee-demo {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.marquee-demo__item {
	display: block;
	width: min(100%, 240px);
	padding: 8px 12px;
	background: #f6f8fa;
	border-radius: 4px;
}
</style>
```
:::

### 方向与间距

`direction` 设置滚动方向（`up` / `down` 需要给容器设高度），`gap` 设置首尾两份内容的间距；`always` 让未超出的内容也滚动；`pauseOnHover` 设为 `false` 后悬停不暂停。

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
	<div class="marquee-demo">
		<Marquee :content="text.repeat(4)" direction="right" class="marquee-demo__item" />
		<Marquee :content="text" always :gap="80" :pause-on-hover="false" class="marquee-demo__item" />
		<Marquee direction="up" class="marquee-demo__item marquee-demo__item--vertical">
			<div v-for="item in 3" :key="item">第 {{ item }} 条通知</div>
		</Marquee>
		<Marquee direction="down" class="marquee-demo__item marquee-demo__item--vertical">
			<div v-for="item in 3" :key="item">第 {{ item }} 条消息</div>
		</Marquee>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Marquee } from '@deot/vc';

const text = ref('ABCDEFG ');
</script>

<style scoped>
.marquee-demo {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.marquee-demo__item {
	width: min(100%, 240px);
	padding: 8px 12px;
	background: #f6f8fa;
	border-radius: 4px;
}

.marquee-demo__item--vertical {
	height: 40px;
	line-height: 20px;
}
</style>
```
:::

### 暂停与事件

`animated` 控制滚动，默认鼠标悬停时暂停（`pauseOnHover`）；`speed` 设置每秒移动的像素数，`delay` 设置开始前停留的毫秒数；每滚完一轮触发 `loop`。

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
	<div class="marquee-demo">
		<Marquee
			:content="text.repeat(4)"
			:animated="isAnimated"
			:delay="1000"
			:speed="100"
			class="marquee-demo__item"
			@loop="handleLoop"
		/>
		<div class="marquee-demo__row">
			<Button @click="handleToggle">切换滚动状态</Button>
		</div>
		<p class="marquee-demo__result">已滚动 {{ count }} 轮</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Marquee, Button } from '@deot/vc';

const text = ref('ABCDEFG ');
const isAnimated = ref(true);
const count = ref(0);

const handleToggle = () => {
	isAnimated.value = !isAnimated.value;
};

const handleLoop = () => {
	count.value++;
};
</script>

<style scoped>
.marquee-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.marquee-demo__item {
	width: min(100%, 240px);
	padding: 8px 12px;
	background: #f6f8fa;
	border-radius: 4px;
}

.marquee-demo__row {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
}

.marquee-demo__result {
	margin: 0;
}
</style>
```
:::

## 移动端

`MMarquee` 与 `Marquee` 的属性、事件、插槽相同，根节点另有标记类 `.vcm-marquee`，只覆盖局部变量 `--vc-marquee-gap`：首尾间距为 750 稿 64（375 宽下 32px），随 `--vc-rem` 缩放；`gap` 属性仍按 px 计算。

:::playground
<!--
<config lang="json5">
{
	mobile: true,
	previewInset: [12, 0],
	previewVariables: [{
		name: '--rem',
		label: 'rem',
		values: ['auto', '0.5px', '0.552px', '0.64px', '1px']
	}]
}
</config>
-->
```vue
<template>
	<div class="m-marquee-demo">
		<MMarquee :content="text.repeat(5)" class="m-marquee-demo__item" />
		<MMarquee direction="up" class="m-marquee-demo__item m-marquee-demo__item--vertical">
			<div v-for="item in 3" :key="item">第 {{ item }} 条通知</div>
		</MMarquee>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { MMarquee } from '@deot/vc';

const text = ref('ABCDEFG ');
</script>

<style scoped>
.m-marquee-demo {
	display: flex;
	flex-direction: column;
	gap: calc(var(--vc-rem) * 32);
	padding-inline: calc(var(--vc-rem) * 32);
}

.m-marquee-demo__item {
	padding: calc(var(--vc-rem) * 16) calc(var(--vc-rem) * 24);
	font-size: calc(var(--vc-rem) * 28);
	background: #f7f7f7;
	border-radius: calc(var(--vc-rem) * 8);
}

.m-marquee-demo__item--vertical {
	height: calc(var(--vc-rem) * 40);
	line-height: calc(var(--vc-rem) * 40);
	box-sizing: content-box;
}
</style>
```
:::

## API

### 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| content | 内容。字符串按文本渲染，也可传渲染函数或 `{ type, value }`（需要 HTML 时传 `{ type: 'html', value }`），见 [Customer](../customer/README.md)；默认插槽优先 | `string \| number \| Function \| { type: string; value: any }` | - | - |
| speed | 每秒移动的像素数 | `number` | - | `50` |
| direction | 内容移动的方向 | `string` | `left`、`right`、`up`、`down` | `left` |
| gap | 首尾两份内容的间距（px），不传时取 `--vc-marquee-gap` | `number` | - | - |
| animated | 是否滚动，设为 `false` 静止 | `boolean` | - | `true` |
| always | 内容未超出容器时也滚动 | `boolean` | - | `false` |
| pauseOnHover | 鼠标悬停时暂停 | `boolean` | - | `true` |
| delay | 开始滚动前停留的时长（毫秒） | `number` | - | `0` |

### 事件

| 事件名 | 说明 | 回调参数 |
| --- | --- | --- |
| loop | 每滚完一轮触发 | - |

### 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 自定义内容，优先于 `content` | - |

### CSS 变量

| 变量 | 说明 | 默认值 |
| --- | --- | --- |
| `--vc-marquee-gap` | 首尾两份内容的间距 | `32px`（MMarquee 为 750 稿 64） |

### 注意事项

- 滚动时内容会渲染两份（第二份 `aria-hidden`），插槽里的组件会创建两次；一轮距离为「单份内容 + 间距」，时长为该距离除以 `speed`。
- 容器与内容的尺寸变化（包括插槽内容、渲染函数依赖变化、在弹窗或隐藏状态下挂载）都会自动重新测量。
- 系统开启「减少动态效果」时不滚动，水平方向溢出部分显示省略号。
- `content` 的字符串按文本渲染；需要 HTML 时传 `{ type: 'html', value }`，这类内容只应来自可信来源，或由全局的 `sanitize` 统一清洗，见 [Customer](../customer/README.md)。
