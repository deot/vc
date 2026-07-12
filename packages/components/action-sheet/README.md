## 组件中文名称（ActionSheet）

动作面板

### 何时使用

从底部弹出的模态框，提供和当前场景相关的 2 个以上的操作动作，也支持提供描述。内置固定的展示样式、不支持特别灵活的修改。


### 基础用法
函数式调用

:::RUNTIME
```vue
<!-- 开发使用的版本，如各种操作改变属性值 -->
<template>
	<div style="padding: 20px; display: flex; flex-direction: column-reverse;">
		<div @click="handleClick">
			唤起ActionSheet
		</div>
	</div>
</template>
<script setup>
import { MActionSheet } from '@deot/vc';

const handleClick = async () => {
	await MActionSheet.open({
		title: '我是标题',
		cancelText: '取消',
		data: [
			{
				content: '选项一',
				subContent: '我是第二级内容',
				onClick: handlePress
			},
			{
				content: '选项二',
				disabled: true,
				onClick: handlePress
			},
			{
				content: 'DELETE',
				class: 'test',
				style: { color: '#ff0000' },
				onClick: handlePress
			}
		]
	});
};

const handlePress = () => {
	return new Promise((r, j) => {
		setTimeout(() => {
			r();
		}, 2000);
	});
};
</script>
```
:::

## API

### 属性

| 属性           | 说明                               | 类型                        | 可选值                                           | 默认值 |
| ------------ | -------------------------------- | ------------------------- | --------------------------------------------- | --- |
| mask         | 是否显示遮罩（只有在position为bottom的时候才有用） | `boolean`                 | true                                          |     |
| maskClosable | 是否允许通过点击遮罩关闭弹窗                   | `boolean`                 | true                                          |     |
| wrapperClass | -                                | `object`、`array`、`string` | -                                             |     |
| wrapperStyle | -                                | `object`、`array`、`string` | -                                             |     |
| scrollRegExp | 判断滑动是否在滚动容器内，防止滚动穿透弹层            | `function`                | `(v) => { return /vc-hack-scroll/.test(v); }` |     |
| title        | 选项上方的标题信息                        | `string`、`function`       | -                                             |     |
| data         | 面板选项列表                           | `array`                   | -                                             |     |
| cancelText   | 取消按钮文字,为空不展示底部取消按钮               | `string`                  | -                                             |     |

### Data 数据结构

| 属性       | 说明                           | 类型                          | 可选值 | 默认值 |
| -------- | ---------------------------- | --------------------------- | --- | --- |
| content    | 内容，字符串默认使用 v-html       | `string`、`function`       | -   |     |
| subContent | 二级内容，字符串默认使用 v-html     | `string`、`function`       | -   |     |
| disabled   | 是否为禁用状态                  | `boolean`                 | -   |     |
| class      | 为对应列添加额外的 class          | `string`、`object`、`array` | -   |     |
| style      | 为对应列添加额外的 style          | `string`、`object`         | -   |     |
| onClick    | 点击事件，返回 false 或 Promise.reject 阻止关闭 | `(action) => any` | -   | -   |

### 方法

| 方法名  | 说明             | 参数      |
| ------ | ---------------- | -------- |
| open   | 打开动作面板       | `options` |
| popup  | 同 open          | `options` |
| destroy | 销毁动作面板实例 | -        |
