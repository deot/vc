## 防抖（Debounce）

防抖按钮

### 何时使用

当需要高度浓缩并快捷传达信息传递给用户时。

### 基础用法

:::RUNTIME
```vue
<template>
	<div>
		<Debounce @click="handleClick">
			点击
		</Debounce>
		<Debounce :tag="Button" @click="handleClick">
			点击
		</Debounce>
	</div>
</template>
<script setup>
import { Debounce, Button } from '@deot/vc';

const handleClick = (e) => {
	console.log(e, new Date());
};

</script>
```
:::

## API

### 属性

| 属性      | 说明                   | 类型                | 默认值            |
| ------- | -------------------- | ----------------- | -------------- |
| wait    | 延迟的时间                | `number`          | 250            |
| tag     | 外层标签`span / div / *` | `string / object` | div            |
| include | 需要防抖的事件              | `Regexp`          | `/^on([A-Z])/` |
| exclude | 不做防抖的事件              | `Regexp`          | -              |

### TODO

- 增加`throttle`属性