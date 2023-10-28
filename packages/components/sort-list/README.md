## 可拖拽排序列表（SortList）
拖拽排序

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
			<div
				slot-scope="{ it }"
				:style="{ background: `#ff33${it.id}${it.id}` }"
				style="width: 200px;line-height: 5; color: white"
			>
				{{ it.id }}
			</div>
		</SortList>
		<div style="margin-top: 50px; margin-left: 10px;">
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

const dataSource = ref(Array.from({ length: 5 }, () => ({ id: `${count++}` })));
const handleAdd = () => {
	dataSource.value.push({ id: `${count++}` });
};
const handleDel = () => {
	dataSource.value.shift();
};
const handleShuffle = () => {
	dataSource.value = dataSource.value.sort((a, b) => Math.random() - 0.5);
};
</script>
```
:::

## 隐藏操作区域
通过设置`mask`隐藏操作区域。

:::RUNTIME
```vue
<template>
	<div>
		<SortList v-model="dataSource" :mask="false">
			<div
				slot-scope="{ it }"
				:style="{ background: `#ff33${it.id}${it.id}` }"
				style="width: 200px;line-height: 5; color: white"
			>
				{{ it.id }}
			</div>
		</SortList>
		<div style="margin-top: 50px; margin-left: 10px;">
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

const dataSource = ref(Array.from({ length: 5 }, () => ({ id: `${count++}` })));
const handleAdd = () => {
	dataSource.value.push({ id: `${count++}` });
};
const handleDel = () => {
	dataSource.value.shift();
};
const handleShuffle = () => {
	dataSource.value = dataSource.value.sort((a, b) => Math.random() - 0.5);
};
</script>
```
:::

## API

### 属性

| 属性           | 说明       | 类型                | 可选值 | 默认值     |
| ------------ | -------- | ----------------- | --- | ------- |
| modelValue   | 数据源      | `array`           | -   | -       |
| tag          | 外层标签     | `string`          |     | - `div` |
| valueKey     | 主键       | `string`、`Number` | -   | `id`    |
| mask         | 遮罩       | `boolean`         | -   | `true`  |
| draggable    | 是否可拖拽    | `boolean`         | -   | `true`  |
| draggableKey | 拖拽的目标key | `string`          | -   | -       |

### 事件
| 事件名    | 说明   | 类型                       | 参数               |
| ------ | ---- | ------------------------ | ---------------- |
| change | 数据改变 | `(value: array) => void` | `value`：排序后的新数组值 |


### 方法
| 方法名         | 说明                | 参数                                                                                                           |
| ----------- | ----------------- | ------------------------------------------------------------------------------------------------------------ |
| getSortList | 获取左移、右移、拖拽、删除后的列表 | `current = { item, index, type }, item: 移动对象; index: 目标对象索引; type: 类型 (left: 左移、right: 右移、drag: 拖拽,其余为删除); ` |

### Slot

| 属性      | 说明   |
| ------- | ---- |
| default | 默认插槽 |


## TODO
1. 去掉dnd事件，兼容移动端
