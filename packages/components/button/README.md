## 按钮（Button）

各种样式的操作按钮

### 何时使用

标记了一个（或封装一组）操作命令，响应用户点击行为，触发相应的业务逻辑。

### 基础用法

通过`type`、`circle`控制按钮的样式。

```vue
<template>
	<div class="v-button-basic">
		<Button>默认按钮</Button>
		<Button type="primary">常规按钮</Button>
		<Button type="error">错误按钮</Button>
		<Button type="success">成功按钮</Button>
		<Button type="warning">警告按钮</Button>
		<Button type="text">文字按钮</Button>
		<br>
		<Button circle>默认按钮</Button>
		<Button circle type="primary">常规按钮</Button>
		<Button circle type="error">错误按钮</Button>
		<Button circle type="success">成功按钮</Button>
		<Button circle type="warning">警告按钮</Button>
	</div>
</template>
<script setup>
import { Button, ButtonGroup } from '@deot/vc';
</script>
<style>
.v-button-basic > button {
	margin-bottom: 10px;
}
</style>
```

### 禁用状态

按钮不可用状态，通过添加`disabled`属性可将按钮设置为不可用状态。

:::RUNTIME
```vue
<template>
	<Button disabled type="primary">常规按钮</Button>
</template>
<script setup>
import { Button, ButtonGroup } from '@deot/vc';
</script>
```
:::

### 不同尺寸

通过设置`size`为`large`、`small`来设置尺寸为大、小的按钮，不设置或者设置`medium`，则尺寸为中。

:::RUNTIME
```vue
<template>
	<div class="v-button-size">
		<Button size="large">大按钮</Button>
		<Button>默认按钮</Button>
		<Button size="small">小按钮</Button>
		<br>
		<Button circle size="large">大按钮</Button>
		<Button circle>默认按钮</Button>
		<Button circle size="small">小按钮</Button>
	</div>
</template>
<script setup>
import { Button, ButtonGroup } from '@deot/vc';
</script>
<style>
.v-button-size > button {
	margin-bottom: 10px;
}
</style>
```
:::

### 图标按钮

:::RUNTIME
```vue
<template>
	<div class="v-button-icon">
		<Button icon="success" type="primary"></Button>
		<Button icon="search" type="primary">搜索</Button>
		<Button type="primary">搜索 <vc-icon type="search"/></Button>
	</div>
</template>
<script setup>
import { Button, ButtonGroup, Icon } from '@deot/vc';
</script>
<style>
.v-button-icon > button {
	margin-bottom: 10px;
}
</style>
```
:::

### 长按钮

按钮长度跟随父元素长度。

:::RUNTIME
```vue
<template>
	<div class="v-button-long">
		<div><Button type="primary" long>常规按钮</Button></div>
		<div style="width: 80%"><Button type="success" long>常规按钮</Button></div>
		<div style="width: 40%"><Button type="warning" long>常规按钮</Button></div>
	</div>
</template>
<script setup>
import { Button, ButtonGroup } from '@deot/vc';
const handlePromise1 = (e) => {
	return new Promise((resolve, reject) => {
		setTimeout(() => {
			resolve();
		}, 300000); 
	});
};
</script>
<style>
.v-button-long > div {
	margin-bottom: 10px;
}
</style>
```
:::

### 点击按钮出现加载图标

点击事件返回一个`promise`

:::RUNTIME
```vue
<template>
	<Button type="primary" @click="handlePromise1">点击加载</Button>
</template>
<script setup>
import { Button, ButtonGroup } from '@deot/vc';
const handlePromise1 = (e) => {
	return new Promise((resolve, reject) => {
		setTimeout(() => {
			resolve();
		}, 300000); 
	});
};
</script>
```
:::

### 按钮组合

需要用`ButtonGroup`包裹，根据`vertical`控制按钮组是水平还是垂直

:::RUNTIME
```vue
<template>
	<div>
		<ButtonGroup>
			<Button>左</Button>
			<Button>右</Button>
		</ButtonGroup>
		<ButtonGroup vertical>
			<Button type="primary" icon="up" />
			<Button type="primary" icon="down" />
		</ButtonGroup>
	</div>
</template>
<script setup>
import { Button, ButtonGroup } from '@deot/vc';
</script>
```
:::

### 不同尺寸的按钮组合

需要用`ButtonGroup`包裹，并在`ButtonGroup`上通过设置`size`为`large` `small`来设置尺寸为大、小的按钮，不设置或者设置`medium`，则尺寸为中

:::RUNTIME
```vue
<template>
	<div>
		<ButtonGroup size="large">
			<Button>大按钮</Button>
			<Button>大按钮</Button>
			<Button>大按钮</Button>
		</ButtonGroup>
		<br>
		<ButtonGroup>
			<Button>常规按钮</Button>
			<Button>常规按钮</Button>
			<Button>常规按钮</Button>
		</ButtonGroup>
		<br>
		<ButtonGroup size="small">
			<Button>小按钮</Button>
			<Button>小按钮</Button>
			<Button>小按钮</Button>
		</ButtonGroup>
	</div>
</template>
<script setup>
import { Button, ButtonGroup } from '@deot/vc';
</script>
```
:::

## API

[link]: https://www.w3school.com.cn/tags/att_button_type.asp

### 基础属性

| 属性        | 说明      | 类型        | 可选值                                                    | 默认值       |
| --------- | ------- | --------- | ------------------------------------------------------ | --------- |
| type      | 按钮的样式选择 | `string`  | `default`、`primary`、`text`、`success`、`error`、`warning` | `default` |
| disabled  | 禁止点击    | `boolean` | -                                                      | `false`   |
| circle    | 按钮是否圆角  | `boolean` | -                                                      | `false`   |
| size      | 按钮大小    | `string`  | `large`、`medium`、`small`                               | `medium`  |
| icon      | 按钮内的图标  | `string`  | -                                                      |           |
| long      | 长按钮     | `boolean` | `false`                                                |           |
| wait      | 阻止重复点击  | `number`  | 0.25                                                   |           |
| html-type | 按钮的类型   | `string`  | `button`、 `submit`、`reset` [描述][link]                  | `button`  |


### 事件

| 事件名   | 说明   | 回调参数                          | 参数说明 |
| ----- | ---- | ----------------------------- | ---- |
| click | 点击事件 | `(e: Event) => Promise<void>` | -    |


### `Group` 属性

| 属性       | 说明        | 类型        | 可选值                      | 默认值      |
| -------- | --------- | --------- | ------------------------ | -------- |
| size     | 调节按钮组件的大小 | `string`  | `large`、`medium`、`small` | `medium` |
| circle   | 按钮是否圆角    | `boolean` | -                        | `false`  |
| vertical | 按钮纵向排列    | `boolean` | -                        | `false`  |

