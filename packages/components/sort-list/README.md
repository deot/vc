## 可拖拽排序列表（SortList）

拖拽排序列表

### 何时使用
一组内容需要进行无序的顺序调换时使用。
- 可拖拽
- 点击按钮可左右移动
- 点击删除可移除元素

## 基础用法

:::RUNTIME
```vue
<template>
	<div>
		<SortList v-model="dataSource">
			<template #default="{ row, index }">
				<div
					:style="{ background: colors[index % colors.length] }"
					style="width: 200px; line-height: 5; color: white; text-align: center"
				>
					{{ row.label }}
				</div>
			</template>
		</SortList>
		<div style="margin-top: 16px;">
			<Button @click="handleAdd">
				添加
			</Button>
			<Button @click="handleDel">
				删除第一个
			</Button>
			<Button @click="handleShuffle">
				乱序
			</Button>
		</div>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { SortList, Button } from '@deot/vc';

let count = 0;
const colors = ['#2f75ef', '#27ae60', '#f59f00', '#7c3aed'];
const dataSource = ref(Array.from({ length: 5 }, () => {
	const id = count++;

	return {
		id,
		label: `Item ${id}`
	};
}));

const handleAdd = () => {
	const id = count++;

	dataSource.value.push({
		id,
		label: `Item ${id}`
	});
};
const handleDel = () => {
	dataSource.value.shift();
};
const handleShuffle = () => {
	dataSource.value = [...dataSource.value].sort(() => Math.random() - 0.5);
};
</script>
```
:::

## 隐藏操作区域

通过设置`mask`隐藏操作区域。

:::RUNTIME
```vue
<template>
	<SortList v-model="dataSource" :mask="false">
		<template #default="{ row }">
			<div style="width: 200px; line-height: 5; color: white; text-align: center; background: #2f75ef">
				{{ row.label }}
			</div>
		</template>
	</SortList>
</template>

<script setup>
import { ref } from 'vue';
import { SortList } from '@deot/vc';

const dataSource = ref([
	{ id: 1, label: 'Item 1' },
	{ id: 2, label: 'Item 2' },
	{ id: 3, label: 'Item 3' }
]);
</script>
```
:::

## API

### 属性

| 属性           | 说明       | 类型                | 可选值 | 默认值 |
| ------------ | -------- | ----------------- | --- | --- |
| modelValue   | 数据源      | `array`           | -   | `[]` |
| tag          | 外层标签     | `string`          | -   | `div` |
| primaryKey   | 主键       | `string`、`number` | -   | `id` |
| mask         | 遮罩       | `boolean`         | -   | `true` |
| draggable    | 是否可拖拽    | `boolean`         | -   | `true` |
| draggableKey | 控制单项是否可拖拽的字段 | `string`、`number` | - | - |

### 事件

| 事件名    | 说明   | 类型                       | 参数               |
| ------ | ---- | ------------------------ | ---------------- |
| change | 数据改变 | `(value: array) => void` | `value`：排序后的新数组值 |

### 方法

| 方法名         | 说明                | 参数 |
| ----------- | ----------------- | --- |
| getSortList | 获取左移、右移、拖拽、删除后的列表 | `{ row, index, type }`，`type` 支持 `left`、`right`、`drag`，其余值为删除 |

### Slot

| 属性    | 说明   |
| ----- | ---- |
| row   | 当前项 |
| index | 当前索引 |

### 移动端

移动端组件通过`MSortList`导出，样式前缀为`vcm-sort-list`。移动端不引入拖拽 polyfill。
