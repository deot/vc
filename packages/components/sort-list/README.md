## 可拖拽排序列表（SortList）

通过原生拖拽或悬停操作调整列表顺序，使用默认插槽自定义每一项内容。

移动端入口导出的 `MSortList` 与 `SortList` 的属性、事件、插槽和方法相同，不渲染悬停操作遮罩，见 [移动端](#移动端)。

### 何时使用

需要调整卡片、图片等内容的展示顺序时使用。

- 可拖拽
- 点击按钮可左右移动
- 点击删除可移除元素

### 基础用法

悬停后可左移、右移或删除当前项。对象数据应提供唯一的 `primaryKey` 字段（默认 `id`）；简单值数组应保证值唯一。默认插槽的参数为 `{ row, index }`，点击遮罩操作或结束拖拽时触发 `change`。

:::playground
<!--
<config lang="json5">
{
	previewInset: 16
}
</config>
-->
```vue
<template>
	<div class="sort-list-demo">
		<SortList v-model="dataSource" @change="handleChange">
			<template #default="{ row, index }">
				<div class="sort-list-demo__card" :style="{ background: colors[index % colors.length] }">
					{{ row.label }}
				</div>
			</template>
		</SortList>
		<div class="sort-list-demo__row">
			<Button @click="handleAdd">添加</Button>
			<Button @click="handleDelete">删除第一个</Button>
			<Button @click="handleShuffle">乱序</Button>
		</div>
		<p class="sort-list-demo__result">当前顺序：{{ dataSource.map(row => row.label).join(' → ') || '暂无数据' }}</p>
		<p class="sort-list-demo__result">change {{ count }} 次</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Button, SortList } from '@deot/vc';

let id = 0;
const colors = ['var(--vc-color-primary)', 'var(--vc-color-success)', 'var(--vc-color-warning)', 'var(--vc-color-error)'];
const createRow = () => {
	id++;
	return { id, label: `条目 ${id}` };
};

const dataSource = ref(Array.from({ length: 5 }, createRow));
const count = ref(0);

const handleChange = () => {
	count.value++;
};

const handleAdd = () => {
	dataSource.value.push(createRow());
};

const handleDelete = () => {
	dataSource.value.shift();
};

const handleShuffle = () => {
	dataSource.value = [...dataSource.value].sort(() => Math.random() - 0.5);
};
</script>

<style scoped>
.sort-list-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.sort-list-demo__card {
	width: 160px;
	line-height: 80px;
	color: #fff;
	text-align: center;
}

.sort-list-demo__row {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
}

.sort-list-demo__result {
	margin: 0;
}
</style>
```
:::

### 隐藏操作区域

设置 `:mask="false"` 隐藏操作区域，仍可拖拽排序。

:::playground
<!--
<config lang="json5">
{
	previewInset: 16
}
</config>
-->
```vue
<template>
	<div class="sort-list-demo">
		<SortList v-model="dataSource" :mask="false">
			<template #default="{ row }">
				<div class="sort-list-demo__card">{{ row.label }}</div>
			</template>
		</SortList>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { SortList } from '@deot/vc';

const dataSource = ref([
	{ id: 1, label: '条目 1' },
	{ id: 2, label: '条目 2' },
	{ id: 3, label: '条目 3' }
]);
</script>

<style scoped>
.sort-list-demo__card {
	width: 160px;
	line-height: 80px;
	color: #fff;
	text-align: center;
	background: var(--vc-color-primary);
}
</style>
```
:::

### 拖拽控制

`draggable` 为 `false` 时整体不可拖拽；`draggableKey` 指定控制单项拖拽的字段，字段值为 `undefined` 时允许，否则按布尔值判断（下例「固定」项不可拖拽）。`draggable` 和 `draggableKey` 只控制拖拽，不禁用遮罩上的移动和删除操作。`primaryKey` 指定唯一标识字段，`tag` 设置每一项的标签。

:::playground
<!--
<config lang="json5">
{
	previewInset: 16
}
</config>
-->
```vue
<template>
	<div class="sort-list-demo">
		<div class="sort-list-demo__row">
			<Switch v-model="isDraggable" />
			<span>draggable</span>
		</div>
		<SortList
			v-model="dataSource"
			:draggable="isDraggable"
			draggable-key="movable"
			primary-key="key"
			tag="section"
		>
			<template #default="{ row }">
				<div class="sort-list-demo__card" :class="{ 'is-fixed': row.movable === false }">
					{{ row.label }}
				</div>
			</template>
		</SortList>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { SortList, Switch } from '@deot/vc';

const isDraggable = ref(true);
const dataSource = ref([
	{ key: 'a', label: '条目 A' },
	{ key: 'b', label: '条目 B（固定）', movable: false },
	{ key: 'c', label: '条目 C', movable: true },
	{ key: 'd', label: '条目 D' }
]);
</script>

<style scoped>
.sort-list-demo {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.sort-list-demo__row {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 8px;
}

.sort-list-demo__card {
	width: 160px;
	line-height: 80px;
	color: #fff;
	text-align: center;
	background: var(--vc-color-primary);
}

.sort-list-demo__card.is-fixed {
	background: var(--vc-color-neutral);
}
</style>
```
:::

## 移动端

`MSortList` 从 `@deot/vc` 导出，复用上述属性、事件、插槽和方法，样式前缀为 `vcm-sort-list`，每一项没有外边距，间距由调用方设置。移动端实现不渲染操作遮罩，`mask` 不生效；依赖浏览器原生拖拽事件，不内置触摸拖拽 polyfill，不能保证仅通过手指滑动完成排序。需要在触屏上调整顺序时，可通过组件 ref 调用 `getSortList` 计算新数组，再赋给数据源。

:::playground
<!--
<config lang="json5">
{
	mobile: true
}
</config>
-->
```vue
<template>
	<div class="m-sort-list-demo">
		<MSortList ref="list" v-model="dataSource" class="m-sort-list-demo__list">
			<template #default="{ row, index }">
				<div class="m-sort-list-demo__card">{{ index + 1 }}. {{ row.label }}</div>
			</template>
		</MSortList>
		<div class="m-sort-list-demo__row">
			<MButton size="small" @click="handleMove">首项右移</MButton>
			<MButton size="small" @click="handleDelete">删除首项</MButton>
		</div>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { MButton, MSortList } from '@deot/vc';

const list = ref();
const dataSource = ref(Array.from({ length: 6 }, (_, index) => ({ id: index + 1, label: `条目 ${index + 1}` })));

const handleMove = () => {
	const [row] = dataSource.value;
	if (!row) return;
	dataSource.value = list.value.getSortList({ row, index: 0, type: 'right' });
};

const handleDelete = () => {
	const [row] = dataSource.value;
	if (!row) return;
	dataSource.value = list.value.getSortList({ row, index: 0 });
};
</script>

<style scoped>
.m-sort-list-demo {
	display: flex;
	flex-direction: column;
	gap: calc(var(--vc-rem) * 32);
	padding-inline: calc(var(--vc-rem) * 32);
}

.m-sort-list-demo__list {
	gap: calc(var(--vc-rem) * 16);
}

.m-sort-list-demo__card {
	width: calc(var(--vc-rem) * 200);
	color: #fff;
	font-size: calc(var(--vc-rem) * 28);
	line-height: calc(var(--vc-rem) * 120);
	text-align: center;
	background: var(--vc-color-primary);
}

.m-sort-list-demo__row {
	display: flex;
	flex-wrap: wrap;
	gap: calc(var(--vc-rem) * 16);
}
</style>
```
:::

## 主题与局部覆盖

全局参数通过 `--vc-<参数>` 配置，单个组件通过 `--vc-sort-list-<参数>` 覆盖。

桌面遮罩文字使用 color-contrast-light。⚠ color-mix：背景由 color-contrast-dark 以 60% 与透明色混合；移动端不提供此遮罩。

透明色增强声明仅在 `@supports` 内生效；不支持 color-mix 时使用 Sass 编译的固定黑色 rgba() 降级值，透明度与上述比例一致，降级值不会随 color-contrast-dark 变量变化。

### 全局

| 参数 | 使用位置 | 值 |
| --- | --- | --- |
| color-contrast-dark | 桌面遮罩背景的派生基色 | `#000000`（亮暗主题相同） |
| color-contrast-light | 桌面遮罩文字 | `#FFFFFF`（亮暗主题相同） |

### 局部

当前组件没有额外的局部 CSS 主题参数。

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

### 主题

SortList 的操作遮罩可通过 `--vc-sort-list-color-contrast-light`（符号颜色，默认取 `--vc-color-contrast-light`，即 `#FFFFFF`）和 `--vc-sort-list-color-contrast-dark`（背景基色，按 60% 与透明色混合，默认取 `--vc-color-contrast-dark`，即 `#000000`）覆盖，见[主题与局部覆盖](#主题与局部覆盖)。默认在两种主题下保持白色符号与深色半透明遮罩，以适配调用方提供的图片或卡片内容。
