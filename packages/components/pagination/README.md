## 分页 (Pagination)
当数据量较多时，使用分页可以快速进行数据切换。每次只加载一个页面。

### 何时使用
- 当加载/渲染所有数据将花费很多时间时；
- 可切换页码浏览数据。

### 基础用法
基本的分页，页数过多时会自动折叠。默认显示总共多少条数据，可以通过设置属性show-count=false来隐藏它。

:::RUNTIME
```vue
<template>
	<div class="v-pagination-basic">
		<div>页数较少时效果</div>
		<Pagination
			class="page"
			:count="50"
		/>
		<div>大于5页时效果</div>
		<Pagination
			class="page"
			:count="60"
		/>
	</div>
</template>
<script setup>
import { Pagination } from '@deot/vc';
</script>
<style>
.v-pagination-basic .page, .v-pagination-basic div {
	margin-bottom: 10px;
}
</style>
```
:::

### 每页数量
可以切换每页显示的数量。

:::RUNTIME
```vue
<template>
	<div class="v-pagination-size">
		<Pagination
			class="page"
			:count="100"
			:show-count="false"
			show-sizer
		/>
		<div>改变每页显示条目数。</div>
	</div>
</template>
<script setup>
import { Pagination } from '@deot/vc';
</script>
<style>
.v-pagination-size .page {
	margin-bottom: 10px;
}
</style>
```
:::

### 电梯
快速跳转到某一页。

:::RUNTIME
```vue
<template>
	<div class="v-pagination-elevator">
		<Pagination
			class="page"
			:count="100"
			show-elevator
		/>
		<div>快速跳转到某一页。</div>
	</div>
</template>
<script setup>
import { Pagination } from '@deot/vc';
</script>
<style>
.v-pagination-elevator .page {
	margin-bottom: 10px;
}
</style>
```
:::

### 调用方法翻页
调用组件方法实现翻页。

:::RUNTIME
```vue
<template>
	<div class="v-pagination-elevator">
		<Pagination
			ref="page"
			class="page"
			:count="100"
			show-elevator
		/>
		<Button @click="handlePrev">上一页</Button>
		<Button @click="handleNext">下一页</Button>
		<Button @click="handlePagination">跳转到第三页</Button>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Pagination, Button } from '@deot/vc';

const page = ref();
const handlePrev = () => {
	page.value.prev();
};

const handleNext = () => {
	page.value.next();
};

const handlePagination = () => {
	page.value.resetPage(3);
};

</script>
<style>
.v-pagination-elevator .page {
	margin-bottom: 10px;
}
</style>
```
:::

## API

### 属性

| 属性                | 说明                        | 类型        | 可选值            | 默认值              |
| ----------------- | ------------------------- | --------- | -------------- | ---------------- |
| current           | 当前页码，支持 `v-model:current` | `number`  | -              | 1                |
| count             | 数据总数                      | `number`  | -              | 0                |
| page-size         | 每页条数                      | `number`  | -              | 10               |
| page-size-options | 每页条数切换的配置                 | `array`   | -              | [10, 20, 30, 40] |
| placement         | 条数切换弹窗的展开方向               | `string`  | `bottom`、`top` | `bottom`         |
| show-count        | 显示总数                      | `boolean` | -              | `true`           |
| show-elevator     | 显示电梯，可以快速切换到某一页           | `boolean` | -              | `false`          |
| show-sizer        | 显示分页，用来改变`page-size`      | `boolean` | -              | `false`          |

### 事件

| 事件名              | 说明         | 回调参数                        | 参数说明                |
| ---------------- | ---------- | --------------------------- | ------------------- |
| change           | 页码改变的回调    | `(page: number) => void`    | `page`：改变后的页码       |
| page-size-change | 切换每页条数时的回调 | `(pageSiz: number) => void` | `pageSize`：切换后的每页条数 |

### 方法

| 方法名       | 说明     | 参数        |
| --------- | ------ | --------- |
| prev      | 向上翻一页  | -         |
| next      | 向下翻一页  | -         |
| resetPage | 跳转到指定页 | `page`：页码 |

### Slot

| 属性 | 说明         |
| -- | ---------- |
| 无  | 自定义显示总数的内容 |

