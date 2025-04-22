## 图标（Icon）
图标

### 何时使用
当需要高度浓缩并快捷传达信息传递给用户时。

### 基础用法
通过`type`控制图标。

:::RUNTIME
```vue
<template>
	<div class="v-icon-basic">
		<Icon type="success"/>
		<Icon type="error"/>
	</div>
</template>

<script setup>
import { Icon, Clipboard } from '@deot/vc';
</script>
<style>
.v-icon-basic > .vc-icon{
	font-size: 30px;
}
.v-icon-basic > svg {
	width: 1em;
	height: 1em;
	fill: currentColor;
	overflow: hidden;
}
</style>
```
:::

### 图标集合(TODO)

:::RUNTIME
```vue
<template>
	<div class="v-icon-basic">
		<Clipboard v-for="(item, index) in items" :key="index" :value="`<vc${m}-icon type=&quot;${item}&quot; />`">
			<Icon :type="item" inherit />
			<p>{{ item }}</p>
		</Clipboard>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Icon, Clipboard } from '@deot/vc';

const items = ref([]);
</script>
<style>
.v-icon-basic {
	display: flex;
	flex-wrap: wrap;
}
.v-icon-basic > div {
	width: 200px;
	padding: 20px;
	text-align: center;
	cursor: pointer;
}
</style>
```
:::

## API

### 属性

属性 | 说明 | 类型 | 可选值 | 默认值
---|---|---|---|---
type | icon类型 | `String` | - | -
inherit | 是否使用svg预设的颜色 | `Boolean` | - | false

> 如果要改变颜色的话: `:inherit="false"`

### 事件

事件名 | 说明 | 回调参数 | 参数说明
---|---|---|---
click | 点击事件 | - | -

### TODO
- 图标内容
- 按需加载包过大问题, 对缓存的压缩处理