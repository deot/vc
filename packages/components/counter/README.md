## 计数器（Counter）

计数器功能

### 何时使用

当需要突出某个数字时，递增或递减动画。

### 基础用法

通过`value`设置目标数字

:::RUNTIME
```vue
<template>
	<div>
		<Counter
			:value="99999"
		/>
	</div>
</template>
<script setup>
import { Counter } from '@deot/vc';
</script>
```
:::

## API

### 属性

| 属性        | 说明    | 类型         | 可选值 | 默认值   |
| --------- | ----- | ---------- | --- | ----- |
| value     | 目标数值  | `number`   | -   | -     |
| precision | 精度    | `number`   | -   | 0     |
| zeroless  | 去除末尾0 | `boolean`  | -   | false |
| placeholder  | 占位符 | `string`  | -   | - |
| render    | 自定义渲染 | `function` | -   | -     |

### 事件

| 事件名      | 说明   | 回调参数 | 参数说明 |
| -------- | ---- | ---- | ---- |
| begin    | 开始回调 | -    | -    |
| complete | 结束回调 | -    | -    |
| change   | 变化回调 | -    | -    |
