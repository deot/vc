## 文字轮播（Marquee）

在固定宽度区域内从右向左循环滚动内容。

### 何时使用
在一小块内容展示通知类的信息时使用。

### 基础用法
支持 `content` 和默认插槽，插槽优先。内容超出容器时滚动，两份内容首尾相接无缝循环；未超出时静止显示。

:::playground
<!-- <config lang="json5">{ previewInset: 16 }</config> -->
```vue
<template>
	<div class="v-marquee-basic">
		<Marquee
			class="_normal"
		>
			<span>{{ text }}</span>
		</Marquee>
		<Marquee
			:content="text"
			class="_normal"
		/>
		<Marquee
			:content="text.repeat(3)"
			class="_normal"
		/>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Marquee } from '@deot/vc';

const text = ref('ABCDEFG');
</script>
<style>
.v-marquee-basic > ._normal {
	width: min(100%, 240px);
	display: block;
	padding: 8px 12px;
	background: #f6f8fa;
	margin: 0 0 8px;
	border-radius: 4px;
}
</style>
```
:::

### 方向与间距
`direction` 设置滚动方向（`up` / `down` 需要给容器设高度），`gap` 设置首尾两份内容的间距；`always` 让未超出的内容也滚动。

:::playground
<!-- <config lang="json5">{ previewInset: 16 }</config> -->
```vue
<template>
	<div class="v-marquee-direction">
		<Marquee :content="text.repeat(4)" direction="right" class="_normal" />
		<Marquee :content="text" always :gap="80" class="_normal" />
		<Marquee direction="up" class="_normal _vertical">
			<div v-for="item in 3" :key="item">第 {{ item }} 条通知</div>
		</Marquee>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Marquee } from '@deot/vc';

const text = ref('ABCDEFG ');
</script>
<style>
.v-marquee-direction > ._normal {
	width: min(100%, 240px);
	padding: 8px 12px;
	background: #f6f8fa;
	margin: 0 0 8px;
	border-radius: 4px;
}
.v-marquee-direction > ._vertical {
	height: 40px;
	line-height: 20px;
}
</style>
```
:::

### 暂停与事件
`animated` 控制滚动，默认鼠标悬停时暂停（`pauseOnHover`）；`delay` 设置开始前停留的毫秒数；每滚完一轮触发 `loop`。

:::playground
<!-- <config lang="json5">{ previewInset: 16 }</config> -->
```vue
<template>
	<div class="v-marquee-animated">
		<Marquee
			:content="text.repeat(4)"
			:animated="isAnimated"
			:delay="1000"
			:speed="100"
			class="_normal"
			@loop="count++"
		/>
		<Button @click="isAnimated = !isAnimated">切换滚动状态</Button>
		<span>已滚动 {{ count }} 轮</span>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Marquee, Button } from '@deot/vc';

const text = ref('ABCDEFG ');
const isAnimated = ref(true);
const count = ref(0);
</script>
<style>
.v-marquee-animated > ._normal {
	width: min(100%, 240px);
	padding: 8px 12px;
	background: #f6f8fa;
	margin-bottom: 8px;
	border-radius: 4px;
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
- 移动端导出 `MMarquee`，与 `Marquee` API 相同，根节点另有 `vcm-marquee`，间距按 750 稿缩放。
