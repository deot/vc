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
		description: '我是描述我是描述我是描述我是描述',
		cancelText: '取消',
		actions: [
			{
				name: '选项一',
				onClick: this.handlePress
			},
			{
				name: '选项二',
				disabled: true,
				onClick: this.handlePress
			},
			{
				name: 'DELETE',
				class: 'test',
				style: { color: '#ff0000' },
				onClick: this.handlePress
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
| actions      | 面板选项列表                           | `array`                   | -                                             |     |
| description  | 选项上方的描述信息                        | `string`                  | -                                             |     |
| cancelText   | 取消按钮文字,为空不展示底部取消按钮               | `string`                  | -                                             |     |

### Action 数据结构

| 属性       | 说明                           | 类型                          | 可选值 | 默认值 |
| -------- | ---------------------------- | --------------------------- | --- | --- |
| name     | 标题                           | `string`                    | -   |     |
| subName  | 二级标题                         | `string`                    | -   |     |
| disabled | 是否为禁用状态                      | `string`                    | -   |     |
| class    | 为对应列添加额外的 class              | `string`                    | -   |     |
| style    | 为对应列添加额外的 style              | `string`、`object`           | -   |     |
| onClick  | 点击事件, 也可支持`Promise`,`cb`回调关闭 | `(action) => Promise<void>` | -   | -   |
