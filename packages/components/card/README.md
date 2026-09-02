## 卡片（Card）

承载标题、操作和主体内容的基础容器。`MCard` 是 `Card` 的移动端入口别名，两者使用相同的属性和插槽。

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
		<div>列表内容一</div>
		<div>列表内容二</div>
		<div>列表内容三</div>
	</Card>
</template>

<script setup>
import { Card } from '@deot/vc';
</script>

<style scoped>
.card-demo {
	max-width: 360px;
}
</style>
```
:::

### 标题与额外内容

通过 `title` 设置文字标题，或使用 `title` 插槽完全自定义标题；`extra` 插槽显示在右上角。提供 `title` 插槽时，不再渲染 `title` 和 `icon`。

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
		<Card title="订单信息">
			<template #extra>
				<a href="#">查看全部</a>
			</template>
			<div>订单编号：VC-2026</div>
			<div>订单状态：已完成</div>
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
	<div class="card-demo-grid">
		<Card>默认边框</Card>
		<Card :border="false">无边框</Card>
		<Card shadow>边框与阴影</Card>
		<Card :border="false" shadow>仅阴影</Card>
	</div>
</template>

<script setup>
import { Card } from '@deot/vc';
</script>

<style scoped>
.card-demo-grid {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 12px;
	max-width: 520px;
	padding: 16px;
	background: var(--vc-background-color);
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
	<div class="card-demo-list">
		<Card title="默认间距">主体内边距为 16px</Card>
		<Card title="自定义间距" :padding="30">主体内边距为 30px</Card>
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
</style>
```
:::

## API

### Card 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| border | 是否显示边框 | `boolean` | - | `true` |
| shadow | 是否显示静态阴影 | `boolean` | - | `false` |
| padding | 主体区域的内边距，单位为 `px` | `number` | - | `16` |
| title | 标题文本 | `string` | - | - |
| icon | 文字标题前的图标类型；提供 `title` 插槽时不生效 | `string` | - | - |

### Card 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 卡片主体内容 | - |
| title | 自定义标题；优先于 `title` 和 `icon` | - |
| extra | 右上角的额外内容 | - |
