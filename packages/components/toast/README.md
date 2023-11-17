## h5弹出层（Toast）
弹出层适用于h5

### 何时使用
移动端轻量的提示，自动消失。

### 基础用法
通过方法直接调用弹层。

:::RUNTIME
```vue
<template>
	<div class="v-toast-basic">
		<Button @click="handleClick">点击出现提示语</Button>
	</div>
</template>

<script setup>
import { MToast, Button } from '@deot/vc';

const handleClick = () => {
	MToast.info('提示语', 1)
};
</script>
```
:::

### 有loading的弹出层
弹出窗5秒后消失，可以点击遮罩层提前关闭。

:::RUNTIME
```vue
<template>
	<div class="v-toast-basic">
		<Button @click="handleClick">点击加载中</Button>
	</div>
</template>

<script setup>
import { MToast, Button } from '@deot/vc';

const handleClick = () => {
	MToast.loading({
		contentL: '提示语',
		duration:  5,
		maskClosable: true
	})
};
</script>
```
:::

## API

### 基础属性

| 属性           | 说明            | 类型                  | 可选值              | 默认值    |
| ------------ | ------------- | ------------------- | ---------------- | ------ |
| content      | 弹出层内容         | `Function`、`string` | -                | -      |
| maskClosable | 点击遮罩层关闭       | `boolean`           | -                | `true` |
| duration     | 弹出层显示时间，单位`ms` | `number`            | -                | 3000      |
| mode         | 弹出层类型         | `string`            | `info`、`loading` | `info` |
