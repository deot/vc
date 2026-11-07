## 分页（Pagination）

按数据总数和每页条数展示页码，支持切换页码、调整每页条数及输入页码跳转。数据加载由调用方处理。

移动端入口导出的 `MPagination` 是独立组件：只有上一页、页码、下一页三段，API 不同，见 [移动端](#移动端)。

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

默认插槽替换总条数内容。通过组件 ref 调用 `previous()`、`next()` 或 `resetPage(page)`；`resetPage` 的参数需由调用方保证是有效页码。

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
const handlePrev = () => pagination.value.previous();
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

## 移动端

`MPagination` 与 `Pagination` 是两个独立组件。它只显示「上一页、当前页 / 总页数、下一页」三段，两侧等分剩余宽度，页码始终居中；翻页按钮使用 `MButton`（medium），颜色、按下态与禁用态沿用 `--vc-button-*`。尺寸按 750 稿设计，随 `--vc-rem` 缩放：上下内边距 22、左右 32，页码字号 36、行高 44，`justify="center"` 时翻页按钮距页码 48（375 宽下为一半的 px）。

`type` 设置翻页区域：`default` 为按钮，`text` 为文字（无内边距，与内容边缘对齐），`simple` 只显示页码。`nextType="primary"` 时下一页为主色按钮或主色文字。`icon` 显示左右箭头；`previousText`、`nextText` 传空字符串时只显示图标，此时按钮为方形。

```vue
<template>
	<MPagination v-model:current="current" :count="60" next-type="primary" />
	<MPagination v-model:current="current" :count="60" type="text" />
	<MPagination
		v-model:current="current"
		:count="60"
		icon
		justify="center"
		previous-text=""
		next-text=""
	/>
</template>

<script setup>
import { ref } from 'vue';
import { MPagination } from '@deot/vc';

const current = ref(1);
</script>
```

`previous`、`next` 插槽替换整个翻页区域，参数中的 `previous()`、`next()` 用于翻页；默认插槽替换中间的页码：

```vue
<template>
	<MPagination v-model:current="current" :count="60" :page-size="20">
		<template #previous="{ current: page, disabled, previous }">
			<span v-if="!disabled" @click="previous">第 {{ page - 1 }} 章</span>
		</template>
		<template #default="{ current: page, total }">
			第 {{ page }} 章 · 共 {{ total }} 章
		</template>
		<template #next="{ current: page, disabled, next }">
			<span v-if="!disabled" @click="next">第 {{ page + 1 }} 章</span>
		</template>
	</MPagination>
</template>

<script setup>
import { ref } from 'vue';
import { MPagination } from '@deot/vc';

const current = ref(1);
</script>
```

## 主题与局部覆盖

全局参数通过 `--vc-<参数>` 配置，组件级覆盖使用 `--vc-pagination-<参数>`。局部参数仅提供组件级入口；可在组件根节点或其祖先上设置。

内嵌或复用的 [input](../input/README.md#主题与局部覆盖) 使用各自的主题入口。

### 全局

| 参数 | 使用位置 | 值 |
| --- | --- | --- |
| color-dark-extralight | 禁用页码及翻页图标 | 亮色：`#909399`；暗色：`#B9B9B9` |
| color-dark-lighter | 移动端页码（`MPagination`） | 亮色：`#515151`；暗色：`#D9D9D9` |
| color-primary-light | 激活及悬停页码文字、边框 | `#4A96FF` |
| color-primary-lighter | 激活及悬停页码背景 | `rgb(45 140 240 / 20%)` |
| foreground-color | 分页文字；移动端 `type="text"` 的翻页文字 | 亮色：`#080F20`；暗色：`#F8F8F8` |

### 局部

当前组件没有额外的局部 CSS 主题参数。

## API

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
| previous | 向前翻一页；首页时不执行 | - | `false \| undefined` |
| next | 向后翻一页；末页时不执行 | - | `false \| undefined` |
| resetPage | 跳转到指定页，不自动校验范围 | `page: number` | `undefined` |

### 状态同步

`current`、`pageSize` 的外部更新会同步到内部状态，不触发事件。`count` 减少导致当前页越界时，内部页码回退到新的末页（至少为 1），此时也不会触发页码更新事件；调用方应同步维护受控页码。`pageSize` 不支持 `v-model:pageSize`。

### MPagination 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| current | 当前页码，支持 `v-model:current` | `number` | - | `1` |
| count | 数据总数；为 0 时显示 `1 / 1` | `number` | - | `0` |
| pageSize | 每页条数，应为正数 | `number` | - | `10` |
| type | 翻页区域 | `string` | `default`（按钮）、`text`（文字）、`simple`（只显示页码） | `'default'` |
| justify | 翻页按钮位置 | `string` | `between`（两端）、`center`（紧挨页码） | `'between'` |
| nextType | 下一页样式；`primary` 时按钮为主色按钮、文字为主色文字 | `string` | `default`、`primary` | `'default'` |
| icon | 翻页按钮显示左右箭头 | `boolean` | - | `false` |
| previousText | 上一页文字；空字符串时只显示图标 | `string` | - | 多语言「上一页」 |
| nextText | 下一页文字；空字符串时只显示图标 | `string` | - | 多语言「下一页」 |
| hideOnSinglePage | 只有一页时不渲染 | `boolean` | - | `false` |

### MPagination 事件

| 事件名 | 说明 | 回调参数 | 参数说明 |
| --- | --- | --- | --- |
| update:current | 交互或实例方法切换到不同页码时触发 | `(page: number) => void` | 新页码 |
| change | 与 `update:current` 一同触发 | `(page: number) => void` | 新页码 |

### MPagination 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| previous | 替换整个上一页区域 | `{ current: number, total: number, disabled: boolean, previous: () => void }` |
| next | 替换整个下一页区域 | `{ current: number, total: number, disabled: boolean, next: () => void }` |
| default | 替换中间的页码 | `{ current: number, total: number }` |

`total` 为总页数，`disabled` 表示已在首页（`previous`）或末页（`next`）。

### MPagination 方法

与 `Pagination` 相同：`previous()`、`next()`、`resetPage(page)`。状态同步规则也相同：外部更新 `current` 不触发事件，`count` 减少导致越界时退到新的末页。
