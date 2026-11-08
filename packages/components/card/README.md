## 卡片（Card）

承载标题、操作和主体内容的基础容器。移动端入口导出的 `MCard` 与 `Card` 的属性和插槽相同，尺寸按 750 稿随 `--vc-rem` 缩放，见 [移动端](#移动端)。

### 何时使用

- 将一组相关信息组织在独立容器中。
- 为内容提供可选标题、右上角操作、边框或阴影。

### 基础用法

Card 默认显示边框，主体区域的内边距为 `16px`。

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
	<Card class="card-demo">
		<div class="card-demo__content">
			<strong>条目概览</strong>
			<span>已完成 24 项条目</span>
			<span>还有 6 项条目待处理</span>
		</div>
	</Card>
</template>

<script setup>
import { Card } from '@deot/vc';
</script>

<style scoped>
.card-demo {
	max-width: 360px;
}

.card-demo__content {
	display: grid;
	gap: 8px;
}

.card-demo__content span {
	color: var(--vc-card-color-dark-light, var(--vc-color-dark-light));
}
</style>
```
:::

### 标题与额外内容

通过 `title` 设置文字标题，或使用 `title` 插槽完全自定义标题；`extra` 插槽显示在右上角：有标题时位于标题栏内、排在标题右侧，与标题行垂直居中，标题过长时省略而不被遮挡；较高的内容（如按钮）占用标题栏的内边距，不撑高标题栏。`icon` 与标题文字间距 `8px`。提供 `title` 插槽时，不再渲染 `title` 和 `icon`。

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
	<div class="card-demo-list">
		<Card title="条目信息">
			<template #extra>
				<a class="card-demo-link" href="#">查看全部</a>
			</template>
			<div>条目编号：ITEM-2026</div>
			<div>条目状态：已完成</div>
		</Card>
		<Card>
			<template #title>
				<strong>自定义标题</strong>
			</template>
			<div>标题插槽可以承载任意内容。</div>
		</Card>
	</div>
</template>

<script setup>
import { Card } from '@deot/vc';
</script>

<style scoped>
.card-demo-list {
	display: grid;
	max-width: 360px;
	gap: 12px;
}

.card-demo-link {
	color: var(--vc-color-primary);
	text-decoration: none;
}

.card-demo-link:hover {
	color: var(--vc-color-primary-light);
	text-decoration: underline;
}
</style>
```
:::

### 边框与阴影

`border` 控制边框，`shadow` 控制静态阴影。未启用 `shadow` 时，Card 在 hover 状态下显示悬浮阴影。

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
	<div class="card-demo-controls">
		<div class="card-demo-actions">
			<Button @click="handleToggleBorder">
				{{ isBorder ? '隐藏边框' : '显示边框' }}
			</Button>
			<Button @click="handleToggleShadow">
				{{ isShadow ? '关闭阴影' : '开启阴影' }}
			</Button>
		</div>
		<Card :border="isBorder" :shadow="isShadow">
			<div class="card-demo-status">
				<span>边框：{{ isBorder ? '开启' : '关闭' }}</span>
				<span>阴影：{{ isShadow ? '开启' : '关闭' }}</span>
			</div>
		</Card>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Button, Card } from '@deot/vc';

const isBorder = ref(true);
const isShadow = ref(false);

const handleToggleBorder = () => {
	isBorder.value = !isBorder.value;
};

const handleToggleShadow = () => {
	isShadow.value = !isShadow.value;
};
</script>

<style scoped>
.card-demo-controls {
	display: grid;
	max-width: 360px;
	gap: 12px;
}

.card-demo-actions {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 8px;
}

.card-demo-status {
	display: flex;
	flex-wrap: wrap;
	gap: 8px 16px;
}
</style>
```
:::

### 主体间距

通过 `padding` 设置主体区域的内边距，单位为 `px`。

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
	<div class="card-demo-controls">
		<div class="card-demo-actions">
			<Button @click="handleDecreasePadding" :disabled="padding <= 8">缩小间距</Button>
			<Button @click="handleIncreasePadding" :disabled="padding >= 40">增大间距</Button>
		</div>
		<Card title="可调节间距" :padding="padding">
			当前主体内边距：{{ padding }}px
		</Card>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Button, Card } from '@deot/vc';

const padding = ref(16);

const handleDecreasePadding = () => {
	padding.value -= 4;
};

const handleIncreasePadding = () => {
	padding.value += 4;
};
</script>

<style scoped>
.card-demo-controls {
	display: grid;
	max-width: 360px;
	gap: 12px;
}

.card-demo-actions {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 8px;
}
</style>
```
:::

## 移动端

`MCard` 的属性、插槽、结构与 `Card` 相同，根节点另有标记类 `.vcm-card`，结构样式、颜色与主题参数共用。尺寸按 750 稿设计，写为 `calc(var(--vc-rem) * n)`，随 `--vc-rem` 缩放（括号内为 375 宽下的 px）：

| 项 | 值 |
| --- | --- |
| 卡片 | 字号 28（14），行高 1.4，圆角 16（8） |
| 标题栏 | 标题字号 32（16）加粗，行高 44（22），内边距 24（12） 32（16），高 92（46） |
| 标题图标 | 与标题文字间距 16（8） |
| 附加内容 | 与标题间距 16（8），与标题行垂直居中；无标题时距顶 24（12）、距右 32（16） |
| 主体 | `padding` 为 750 稿长度，默认 32（16） |

与桌面端的差异：

- 没有悬停浮起阴影：触屏点击后 `:hover` 会保持。`shadow` 的静态阴影不变。

边框保持 1px（高分屏 0.5px），不随 `--vc-rem` 缩放。

两端的尺寸都写成局部变量 `--vc-card-<键>`，桌面端的默认值为 px，移动端在 `.vcm-card` 上覆盖，与样式的加载顺序无关。键为 `font-size`、`radius`、`header-padding`、`title-font-size`、`title-line-height`、`icon-gap`、`extra-gap`、`extra-top`、`extra-right`、`transition`；`MCard` 另把主题参数 `--vc-card-box-shadow-floating` 设为 `none`。

```vue
<template>
	<MCard title="条目信息">
		<template #extra>
			<span>查看全部</span>
		</template>
		条目状态：已完成
	</MCard>
</template>

<script setup>
import { MCard } from '@deot/vc';
</script>
```

## 主题与局部覆盖

全局参数通过 `--vc-<参数>` 配置，单个组件通过 `--vc-card-<参数>` 覆盖。同一参数可能作用于多个状态；多命名空间时在使用位置中标明。

### 全局

| 参数 | 使用位置 | 值 |
| --- | --- | --- |
| color-dark | 标题文字 | 亮色：`#000000`；暗色：`#FFFFFF` |
| color-neutral-light | 普通及悬停边框、标题分隔线 | 亮色：`#EDEFF1`；暗色：`#3B4354` |
| background-color-lightest | 卡片背景 | 亮色：`#FFFFFF`；暗色：`#252B3A` |
| box-shadow | 开启 shadow 时的阴影 | 亮色：`0 0 8px 0 rgba(0, 0, 0, 0.1)`；暗色：`0 0 8px 0 rgba(255, 255, 255, 0.05)` |
| box-shadow-floating | 悬停阴影 | 亮色：`0 4px 12px rgba(0, 0, 0, 0.12)`；暗色：`0 4px 12px rgba(0, 0, 0, 0.32)` |

### 局部

当前组件没有额外的局部 CSS 主题参数。

## API

### Card 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| border | 是否显示边框 | `boolean` | - | `true` |
| shadow | 是否显示静态阴影 | `boolean` | - | `false` |
| padding | 主体区域的内边距：数字单位为 `px`（`MCard` 为 750 稿长度），字符串为 CSS 长度 | `number \| string` | - | `16`；`MCard` 为 `32` |
| title | 标题。字符串按文本渲染，也可传渲染函数或 `{ type, value }`，见 [Customer](../customer/README.md) | `string \| number \| Function \| { type: string; value: any }` | - | - |
| icon | 文字标题前的图标类型；提供 `title` 插槽时不生效 | `string` | - | - |

### Card 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 卡片主体内容 | - |
| title | 自定义标题；优先于 `title` 和 `icon` | - |
| extra | 右上角的额外内容；有标题时位于标题栏内、标题右侧 | - |
