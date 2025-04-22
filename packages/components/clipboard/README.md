## 复制（Clipboard）
复制内容

### 何时使用
用于复制页面内的一段文字。

### 基础用法
通过`value`绑定需要复制的内容。

:::RUNTIME
```vue
<template>
	<div>
		<input v-model="msg" type="text">
		<br>
		<Clipboard :value="msg">
			点我复制
		</Clipboard>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Clipboard } from '@deot/vc';

const msg = ref('我是被复制的内容');
</script>
```
:::

### 修改复制的内容
通过`before`在复制前修改复制的内容。

:::RUNTIME
```vue
<template>
	<div>
		<input v-model="msg" type="text">
		<br>
		<Clipboard
			:value="msg"
			tag="span"
			@before="handleBefore"
			@after="handleAfter"
		>
			点我复制
		</Clipboard>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Message, Clipboard } from '@deot/vc';

const msg = ref('我是被复制的内容');

const handleAfter = (value) => {
	Message.success({
		content: `复制成功：${value}`
	});
	return value;
};

const handleBefore = (e, value) => {
	return value + '被before修改';
};
</script>
```
:::

## API

### 属性

| 属性    | 说明      | 类型                | 可选值 | 默认值   |
| ----- | ------- | ----------------- | --- | ----- |
| value | 复制的文本内容 | `string`          | -   | -     |
| tag   | 外层标签    | `string`、`object` | -   | `div` |


### 事件

| 事件名    | 说明     | 回调参数                                         | 参数说明                          |
| ------ | ------ | -------------------------------------------- | ----------------------------- |
| before | 复制前的操作 | `(e: event, value: string) => Promise<void>` | `event`: 触发事件; `value`: 复制的内容 |
| after  | 复制后的操作 | `(value: string) => void`                    | `value`: 复制的内容                |




