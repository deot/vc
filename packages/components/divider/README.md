## 分割线（Divider）

区隔内容的分割线。

### 何时使用

用于分隔不同内容段落，或在行内分隔相邻的文字与操作。

### 基础用法

默认显示水平分割线。通过默认插槽添加内容，使用 `placement` 设置内容在分割线上的位置。

:::playground
<!--
<config lang="json5">
{ previewInset: 24 }
</config>
-->
```vue
<template>
	<div class="divider-demo">
		<section class="divider-demo__section">
			<h4>基础分割线</h4>
			<p>用于分隔两个独立的内容区块。</p>
		</section>
		<Divider />
		<section class="divider-demo__section">
			<h4>带标题的分割线</h4>
			<p>标题可以显示在分割线的左侧、居中或右侧。</p>
		</section>
		<Divider placement="left">左侧标题</Divider>
		<p class="divider-demo__content">左侧标题适合标记新内容的开始。</p>
		<Divider>居中标题</Divider>
		<p class="divider-demo__content">居中标题适合强调并列内容的层次。</p>
		<Divider placement="right">右侧标题</Divider>
		<p class="divider-demo__content">右侧标题可用于补充说明或状态。</p>
	</div>
</template>

<script setup>
import { Divider } from '@deot/vc';
</script>

<style scoped>
.divider-demo__section h4 {
	margin: 0 0 8px;
	font-size: 16px;
}

.divider-demo__section p,
.divider-demo__content {
	margin: 0;
	color: var(--vc-color-dark-lightest);
	line-height: 1.7;
}
</style>
```
:::

### 竖向分割线

设置 `vertical` 后用于行内分隔，此时不渲染默认插槽，`placement` 不生效。

:::playground
<!--
<config lang="json5">
{ previewInset: 24 }
</config>
-->
```vue
<template>
	<nav class="divider-nav" aria-label="内容导航">
		<a href="#overview">概览</a>
		<Divider vertical />
		<a href="#details">详情</a>
		<Divider vertical />
		<a href="#history">更新记录</a>
	</nav>
</template>

<script setup>
import { Divider } from '@deot/vc';
</script>

<style scoped>
.divider-nav {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	font-size: 14px;
}

.divider-nav a {
	color: var(--vc-color-primary);
	text-decoration: none;
}
</style>
```
:::

## API

`MDivider` 是 `Divider` 的别名，属性、插槽和样式一致，可从 `@deot/vc` 导入。

### 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| vertical | 是否显示竖向分割线 | `boolean` | - | `false` |
| placement | 水平分割线插槽内容的位置，仅在 `vertical` 为 `false` 时生效 | `string` | `left` / `center` / `right` | `center` |

### 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 水平分割线中间的内容，竖向模式下不渲染 | - |
