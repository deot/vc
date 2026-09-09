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
	<div>
		<p>第一段内容</p>
		<Divider />
		<p>第二段内容</p>
		<Divider placement="left">左侧标题</Divider>
		<p>第三段内容</p>
		<Divider>居中标题</Divider>
		<p>第四段内容</p>
		<Divider placement="right">右侧标题</Divider>
		<p>第五段内容</p>
	</div>
</template>

<script setup>
import { Divider } from '@deot/vc';
</script>
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
	<div>
		<span>概览</span>
		<Divider vertical />
		<span>详情</span>
		<Divider vertical />
		<span>记录</span>
	</div>
</template>

<script setup>
import { Divider } from '@deot/vc';
</script>
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
