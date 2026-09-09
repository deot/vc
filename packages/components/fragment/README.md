## 空标签（Fragment）

渲染默认插槽中的内容，不增加外层 DOM 元素。

### 何时使用

需要用组件标签对多个同级节点进行语义分组，同时保留父容器的直接子元素布局时使用。Vue 3 原生支持多根节点，普通多根模板无需额外使用此组件。

### 基础用法

下面三个元素仍是 Flex 容器的直接子元素，`Fragment` 不会生成包裹它们的标签。

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
	<div class="fragment-demo">
		<Fragment>
			<span>第一个节点</span>
			<span>第二个节点</span>
			<span>第三个节点</span>
		</Fragment>
	</div>
</template>

<script setup>
import { Fragment } from '@deot/vc';
</script>

<style scoped>
.fragment-demo {
	display: flex;
	flex-wrap: wrap;
	gap: 16px;
}
</style>
```
:::

## API

### 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 要渲染的子节点；未提供时不渲染可见内容 | - |

组件没有自定义属性、事件或公开方法。需要设置样式或监听 DOM 事件时，请将 `class`、`style` 和事件监听器直接绑定到插槽中的实际元素上。

### 移动端

`MFragment` 是 `Fragment` 的别名，使用相同实现和默认插槽，可从 `@deot/vc` 导入。
