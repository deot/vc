## 步骤条
引导用户按照流程完成任务的导航条。

### 何时使用
当任务复杂或者存在先后关系时，将其分解成一系列步骤，从而简化任务。

### 基础用法
<!-- 仅展示最基本的用法 -->
:::RUNTIME
```vue
<template>
	<div style="padding: 20px">
		<StepsBar
			v-model="current"
			:data="dataSource"
			@change="handleChange"
		/>
		<Steps :current="2" style="margin-top: 20px">
			<Step title="这是标题" subtitle="我是子标题" description="我是描述我是描述我是描述我是描述我是描述我是描述我是描述我是描述" />
			<Step title="这是标题" subtitle="我是子标题" description="我是描述我是描述我是描述我是描述我是描述我是描述我是描述我是描述" />
			<Step title="这是标题" subtitle="我是子标题" description="我是描述我是描述我是描述我是描述我是描述我是描述我是描述我是描述" />
		</Steps>
		<Steps :current="2" style="margin-top: 20px" direction="vertical">
			<Step title="这是标题" subtitle="我是子标题" description="我是描述我是描述我是描述我是描述我是描述我是描述我是描述我是描述" />
			<Step title="这是标题" subtitle="我是子标题" description="我是描述我是描述我是描述我是描述我是描述我是描述我是描述我是描述" />
			<Step title="这是标题" subtitle="我是子标题" description="我是描述我是描述我是描述我是描述我是描述我是描述我是描述我是描述" />
		</Steps>
		<Steps :current="2" style="margin-top: 20px" size="small">
			<Step title="这是标题" subtitle="我是子标题" description="我是描述我是描述我是描述我是描述我是描述我是描述我是描述我是描述" />
			<Step title="这是标题" subtitle="我是子标题" description="我是描述我是描述我是描述我是描述我是描述我是描述我是描述我是描述" />
			<Step title="这是标题" subtitle="我是子标题" description="我是描述我是描述我是描述我是描述我是描述我是描述我是描述我是描述" />
		</Steps>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Steps, Step, StepsBar } from '@deot/vc';

const current = ref('1');

const dataSource = ref([
	{
		value: '1',
		label: '第1步'
	},
	{
		value: '2',
		label: '第2步'
	},
	{
		value: '3',
		label: '第3步'
	}
]);
const handleChange = (e) => {
	console.log(e);
};
</script>
```
:::

## API
### Steps 属性

| 属性        | 说明                                               | 类型       | 可选值                               | 默认值          |
| --------- | ------------------------------------------------ | -------- | --------------------------------- | ------------ |
| current   | 指定当前步骤，从 1 开始记数。在子 Step 元素中，可以通过 `status` 属性覆盖状态 | `number` | -                                 | 0            |
| direction | 指定步骤条方向。目前支持水平（`horizontal`）和竖直（`vertical`）两种方向  | `string` | `horizontal` `vertical`           | `horizontal` |
| size      | 指定大小，目前支持普通（`default`）和迷你（`small`）               | `string` | `default` `small`                 | `default`    |
| status    | 指定当前步骤的状态                                        | `string` | `wait` `process` `finish` `error` | `process`    |


### Steps Slot
属性 | 说明
---|---
default | -

### Step 属性

| 属性          | 说明        | 类型       | 可选值                               | 默认值       |
| ----------- | --------- | -------- | --------------------------------- | --------- |
| title       | 标题        | `string` | -                                 |           |
| subtitle    | 子标题       | `string` | -                                 |           |
| description | 步骤的详情描述   | `string` | -                                 |           |
| icon        | 步骤图标的类型   | `string` | -                                 |           |
| status      | 指定当前步骤的状态 | `string` | `wait` `process` `finish` `error` | `process` |

### Step Slot

| 属性          | 说明     |
| ----------- | ------ |
| title       | 自定义标题  |
| subtitle    | 自定义子标题 |
| description | 自定义描述  |



