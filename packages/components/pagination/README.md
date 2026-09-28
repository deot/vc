## 分页（Pagination）

按数据总数和每页条数展示页码，支持切换页码、调整每页条数及输入页码跳转。数据加载由调用方处理。

### 何时使用

用于列表、表格等需要分批加载或展示数据的场景。

### 基础用法

使用 `v-model:current` 同步当前页。默认显示总条数，设置 `:show-count="false"` 可隐藏；页码较多时显示省略号，点击可前后跳转 5 页。总数为 0 时仍显示第 1 页。

:::playground
<!-- <config lang="json5">{ previewInset: 16 }</config> -->
```vue
<template>
	<div class="demo">
		<Pagination v-model:current="current" class="pagination" :count="200" />
		<p>当前第 {{ current }} 页，每页 10 条。</p>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Pagination } from '@deot/vc';

const current = ref(1);
</script>
<style scoped>
.demo { overflow-x: auto; }
.pagination { flex-wrap: wrap; row-gap: 12px; }
.demo p { margin: 12px 0 0; }
</style>
```
:::

### 每页数量与快速跳转

`showSizer` 显示条数选择器，`showElevator` 显示页码输入框，输入后按 Enter 跳转。输入超过总页数时取最后一页。

选择每页条数会触发 `page-size-change`，组件内部回到第 1 页，但不会同时触发 `update:current` 或 `change`。使用受控页码时，应在处理函数中同步重置页码，并按需加载数据。

:::playground
<!-- <config lang="json5">{ previewInset: 16 }</config> -->
```vue
<template>
	<div class="demo">
		<Pagination
			v-model:current="current"
			class="pagination"
			:count="200"
			:page-size="pageSize"
			:page-size-options="[10, 20, 50]"
			show-sizer
			show-elevator
			@page-size-change="handlePageSizeChange"
		/>
		<p>当前第 {{ current }} 页，每页 {{ pageSize }} 条。</p>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Pagination } from '@deot/vc';

const current = ref(1);
const pageSize = ref(10);
const handlePageSizeChange = (value) => {
	pageSize.value = value;
	current.value = 1;
};
</script>
<style scoped>
.demo { overflow-x: auto; }
.pagination { flex-wrap: wrap; row-gap: 12px; }
.demo p { margin: 12px 0 0; }
</style>
```
:::

### 自定义总数与实例方法

默认插槽替换总条数内容。通过组件 ref 调用 `prev()`、`next()` 或 `resetPage(page)`；`resetPage` 的参数需由调用方保证是有效页码。

:::playground
<!-- <config lang="json5">{ previewInset: 16 }</config> -->
```vue
<template>
	<div class="demo">
		<Pagination ref="pagination" v-model:current="current" class="pagination" :count="100">
			共 100 条记录 · 第 {{ current }} 页
		</Pagination>
		<div class="actions">
			<Button @click="handlePrev">上一页</Button>
			<Button @click="handleNext">下一页</Button>
			<Button @click="handleJump">跳转到第 3 页</Button>
		</div>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Pagination, Button } from '@deot/vc';

const pagination = ref();
const current = ref(1);
const handlePrev = () => pagination.value.prev();
const handleNext = () => pagination.value.next();
const handleJump = () => pagination.value.resetPage(3);
</script>
<style scoped>
.demo { overflow-x: auto; }
.pagination { flex-wrap: wrap; row-gap: 12px; }
.actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
</style>
```
:::

## API

`MPagination` 为 `Pagination` 的别名，使用同一实现、样式和 API。

### 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| current | 当前页码，支持 `v-model:current` | `number` | - | `1` |
| count | 数据总数 | `number` | - | `0` |
| pageSize | 每页条数，应为正数 | `number` | - | `10` |
| pageSizeOptions | 每页条数选项，传入正数数组 | `unknown[]` | - | `[10, 20, 30, 40]` |
| placement | 条数选择器弹层方向，透传给 Select | `string` | 同 Select 的 placement | `'bottom'` |
| portal | 条数选择器弹层是否挂载到 body | `boolean` | - | `true` |
| showCount | 显示总数区域（包括默认插槽） | `boolean` | - | `true` |
| showElevator | 显示页码输入框，按 Enter 跳转 | `boolean` | - | `false` |
| showSizer | 显示每页条数选择器 | `boolean` | - | `false` |

### 事件

| 事件名 | 说明 | 回调参数 | 参数说明 |
| --- | --- | --- | --- |
| update:current | 交互或实例方法切换到不同页码时触发 | `(page: number) => void` | 新页码 |
| change | 与 `update:current` 一同触发 | `(page: number) => void` | 新页码 |
| page-size-change | 通过选择器切换每页条数时触发 | `(pageSize: number) => void` | 新的每页条数 |

### 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 自定义总数内容，仅在 `showCount` 为 `true` 时渲染 | - |

### 方法

| 方法名 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| prev | 向前翻一页；首页时不执行 | - | `false \| undefined` |
| next | 向后翻一页；末页时不执行 | - | `false \| undefined` |
| resetPage | 跳转到指定页，不自动校验范围 | `page: number` | `undefined` |

### 状态同步

`current`、`pageSize` 的外部更新会同步到内部状态，不触发事件。`count` 减少导致当前页越界时，内部页码回退到新的末页（至少为 1），此时也不会触发页码更新事件；调用方应同步维护受控页码。`pageSize` 不支持 `v-model:pageSize`。
