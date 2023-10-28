## 手机端常用列表（List）
手机端展示数据列表

### 基础用法

:::RUNTIME
```vue
<template>
	<div class="v-list-basic">
		<div style="text-align: center">我是手机</div>
		<MList :label-width="100" style="margin: 20px 0;">
			<MListItem :arrow="false" label="姓名">
				<template #label="">
					<div />
				</template>
				<template #extra="">
					<div>2</div>
				</template>
			</MListItem>
			<MListItem label="姓名" extra="啦啦啦" />
			<MListItem :arrow="false" label="姓名" extra="啦啦啦" />
		</MList>
	</div>
</template>

<script setup>
import { MList, MListItem } from '@deot/vc';
</script>
<style>
.v-list-basic {
	width: 300px;
	margin: 10px;
	padding: 10px 0;
	box-shadow: 0 0 10px 0 rgba(213, 213, 213, 0.5);
}
</style>
```
:::

## API

### 属性

| 属性         | 说明                | 类型                | 可选值 | 默认值    |
| ---------- | ----------------- | ----------------- | --- | ------ |
| labelWidth | `item`内`label`的宽度 | `string`、`number` | -   | -      |
| border     | 是否显示边框            | `Boolean`         | -   | `true` |


### Item属性

| 属性       | 说明                                             | 类型                | 可选值                                    | 默认值     |
| -------- | ---------------------------------------------- | ----------------- | -------------------------------------- | ------- |
| width    | `item`内`label`的宽度,优先级高于`list`内的labelWidth      | `string`、`number` | -                                      | -       |
| label    | label 内容                                       | `string`          | -                                      | -       |
| extra    | 右边的内容                                          | `string`          | -                                      | -       |
| arrow    | 右边有无箭头                                         | `Boolean`         | -                                      | `false` |
| multiple | 多行                                             | `Boolean`         | -                                      | `false` |
| to       | 跳转的地址, 如果是带`http(s)`则采用`window.open/href`方式打开 | `string`、`object` | -                                      | -       |
| indent   | 设置`paddingLeft`值                               | `number`          | -                                      | 12      |
| method   | 跳转的方式,只在有`$router`的情况下生效                       | `string`          | `push`、`replace`、`go`、`back`、`forward` | `push`  |
| href     | 跳转的地址, 使用location.href                         | `Boolean`         | -                                      | false   |


### Item Slot

| 属性    | 说明              |
| ----- | --------------- |
| label | label 内容        |
| extra | 右边内容（替代`extra`） |
