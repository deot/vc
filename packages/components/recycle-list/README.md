## 组件中文名称（RecyleList）
可回收的滚动列表

> 必须保证要有一个固定高度的父容器

### 何时使用
- 优化滚动列表
- 瀑布流
- 倒置列表


### 基础用法
介绍如何使用组件，通过设置属性`attr`、`attr1`来达到什么效果。

:::RUNTIME
```vue
<template>
	<RecyleList
		class="list"
		:style="`height: 200px`"
		:load-data="loadData"
	>
		<template #default="{ row }">
			<div>
				{{ row }}
			</div>
		</template>
	</RecyleList>
</template>
<script setup>
import { RecycleList } from '@deot/vc';

let count = 0;
const loadData = (page, pageSize$) => {
	const list = [];
	return new Promise((resolve) => {
		// 模拟请求 50 条数据，因为 size 设置为 50
		setTimeout(() => {
			for (let i = 0; i < 50; i++) {
				list.push({
					id: count++,
					page,
					height: ((i % 10) + 1) * 20
				});
			}
			resolve(list);
		}, 1000);
	});
};
</script>
```
:::

## API

### 属性
| 属性                | 说明             | 类型         | 可选值 | 默认值           |
| ----------------- | -------------- | ---------- | --- | ------------- |
| disabled          | 是否禁止触发loadData | `boolean`  | -   | false         |
| pageSize          | 分页的数量大小        | `number`   | -   | 20            |
| offset            | 底部拉取更多数据的距离    | `number`   | -   | 100           |
| loadData          | 获取更多数据         | `function` | -   | `() => false` |
| cols              | 多列，不定高默认支持瀑布流  | `number`   | -   | `1`           |
| gutter            | 多列时边距          | `number`   | -   | `0`           |
| inverted          | 倒置             | `boolean`  | -   | `false`       |
| vertical          | 滚动方向           | `boolean`  | -   | `true`        |
| renderEmpty       | 渲染空数据          | `function` | -   | -             |
| renderFinish      | 渲染完成状态         | `function` | -   | -             |
| renderLoading     | 渲染加载状态         | `function` | -   | -             |
| renderPlaceholder | 渲染占位状态         | `function` | -   | -             |


### 事件

| 事件名       | 说明   | 回调参数 | 参数说明 |
| --------- | ---- | ---- | ---- |
| eventName | 事件说明 | -    | -    |


### 方法

| 方法名           | 说明                  | 参数 |
| ------------- | ------------------- | -- |
| reset         | 清空列表全部内容，重置数据       | -  |
| refreshLayout | 动态变化时，强制刷新布局（内部已处理） | -  |
| scrollTo      | 滚动到指定位置             | -  |


### slot

| 名称          | 说明              |
| ----------- | --------------- |
| placeholder | 未加载数据时占位用的，如骨架屏 |
| loading     | 加载更多的提示文案的具名插槽  |
| finish      | 无更多数据的提示文案的具名插槽 |
| empty       | 首次加载后无数据时展示     |
| header      | 头部              |
| footer      | 尾部              |


## TODO
- 支持横向滚动


