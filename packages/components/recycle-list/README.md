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
// current: 第N次请求（从1开始）；count: 当前已加载总条数（含data传入的本地数据），可作为服务端偏移
const loadData = ({ current, count: loaded }) => {
	const list = [];
	return new Promise((resolve) => {
		// 模拟每次请求 50 条数据
		setTimeout(() => {
			for (let i = 0; i < 50; i++) {
				list.push({
					id: count++,
					page: current,
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
| batchSize         | 每次构建/测量的节点批次大小；本地 `data` 按批次懒构建；有 placeholder 时亦作为请求期间预分配的占位节点数（大数据量建议调大如 `200`） | `number`   | -   | `20`          |
| bufferSize        | 在可见数据索引前后额外渲染的节点数量 | `number`   | -   | `0`           |
| overscan          | 视口上下（横向时左右）额外预渲染的距离，单位 px | `number`   | -   | `50`          |
| threshold         | 距离加载边缘小于等于该值时触发加载，单位 px | `number`   | -   | `100`         |
| loadData          | 获取更多数据，`({ current, count }) => response` | `function` | -   | `() => false` |

#### loadData 契约

- 参数：`{ current, count }`。`current` 为第N次请求（从1开始）；`count` 为当前已加载总条数（含 `data` 传入的本地数据），可作为服务端偏移（offset）。
- 返回：`Array`、`{ data, finished }` 或 falsy（如 `false`）。
- 归一化：falsy 或无 `data` → 结束；裸数组视为 `{ data }`；未显式给 `finished` 时按内容推断——`data.length > 0` 为未结束，空页为结束。
- 注意：末页刚好满页时，需再返回一次空数组（或显式 `finished: true`）才会终止加载。
| cols              | 多列，不定高默认支持瀑布流  | `number`   | -   | `1`           |
| gutter            | 多列时边距          | `number`   | -   | `0`           |
| inverted          | 倒置             | `boolean`  | -   | `false`       |
| vertical          | 滚动方向           | `boolean`  | -   | `true`        |
| renderEmpty       | 渲染空数据          | `function` | -   | -             |
| renderComplete    | 渲染完成状态         | `function` | -   | -             |
| renderLoading     | 渲染加载状态         | `function` | -   | -             |
| renderPlaceholder | 渲染占位状态         | `function` | -   | -             |


### 事件

| 事件名       | 说明   | 回调参数 | 参数说明 |
| --------- | ---- | ---- | ---- |
| row-resize | 子元素size变化 | -    | -    |


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
| complete    | 无更多数据的提示文案的具名插槽 |
| empty       | 首次加载后无数据时展示     |
| header      | 头部              |
| footer      | 尾部              |


## TODO
- 支持横向滚动
