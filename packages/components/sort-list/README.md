## 可拖拽排序列表（SortList）

通过原生拖拽或悬停操作调整列表顺序，使用默认插槽自定义每一项内容。

### 何时使用
需要调整卡片、图片等内容的展示顺序时使用。

- 可拖拽
- 点击按钮可左右移动
- 点击删除可移除元素

### 基础用法

悬停后可左移、右移或删除当前项。对象数据应提供唯一的 `primaryKey` 字段；简单值数组应保证值唯一。

:::playground
<!-- <config lang="json5">{ previewInset: 16 }</config> -->
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
		<div class="sort-list-tools">
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
		<p>当前顺序：{{ dataSource.map(row => row.label).join(' → ') || '暂无数据' }}</p>
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

<style scoped>
.sort-list-tools {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
	margin-top: 16px;
}
</style>
```
:::

### 隐藏操作区域

设置 `:mask="false"` 隐藏操作区域，仍可拖拽排序。`draggable` 和 `draggableKey` 只控制拖拽，不禁用遮罩上的移动和删除操作。

:::playground
<!-- <config lang="json5">{ previewInset: 16 }</config> -->
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
| modelValue   | 数据源，支持 `v-model` | `any[]` | - | `[]` |
| tag          | 每一项的标签，列表外层固定为 `div` | `string` | - | `'div'` |
| primaryKey   | 对象项的唯一标识字段；简单值以自身作为标识 | `string \| number` | - | `'id'` |
| mask         | 是否显示悬停操作遮罩，仅 SortList 生效 | `boolean` | - | `true` |
| draggable    | 是否可拖拽    | `boolean`         | -   | `true` |
| draggableKey | 控制单项拖拽的字段；字段值为 `undefined` 时允许，否则按布尔值判断；`draggable=false` 优先 | `string \| number` | - | `undefined` |

### 事件

| 事件名    | 说明   | 回调参数                       | 参数说明               |
| ------ | ---- | ------------------------ | ---------------- |
| update:modelValue | 点击遮罩操作或结束拖拽时触发，用于同步 `v-model` | `value: any[]` | 当前列表，包含删除结果 |
| change | 与 `update:modelValue` 同时触发；拖拽结束时即使顺序未变也触发 | `value: any[]` | 当前列表 |

### 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 自定义每项内容 | `{ row: any, index: number }`，`index` 为从 0 开始的当前索引 |

### 方法

| 方法名 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| getSortList | 计算操作后的新数组，不修改当前列表，也不触发事件 | `{ row: any, index: number, type?: string }`；`left` / `right` 相对 `index` 移动，`drag` 插入到 `index`，其他值（含省略）删除该项 | `any[]` |

通过组件 ref 调用 `getSortList`，需要应用结果时自行赋给绑定的数据源。传入当前列表项及其索引，拖拽计算时传入目标索引。

### 移动端

`MSortList` 从 `@deot/vc` 导出，复用上述属性、事件、插槽和方法，样式前缀为 `vcm-sort-list`。移动端实现不渲染操作遮罩，`mask` 不生效；依赖浏览器原生拖拽事件，不内置触摸拖拽 polyfill，不能保证仅通过手指滑动完成排序。

### 主题

SortList 的操作遮罩可通过 `--vc-sort-list-mask-foreground-color`（默认 `#fff`）和 `--vc-sort-list-mask-background-color`（默认 `rgb(0 0 0 / 60%)`）覆盖。默认在两种主题下保持白色符号与深色半透明遮罩，以适配调用方提供的图片或卡片内容。
