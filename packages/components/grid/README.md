## 栅格（Grid）

基于 CSS grid 的布局容器：默认 24 列，按顺序自动换行，支持固定宽度的列、合并、对齐、折叠，以及按容器宽度响应。

### 何时使用

- 表单、筛选栏、卡片列表等需要按列排布的场景。
- 需要“某列固定宽度、其余列分配剩余宽度”时，用 `columns` 写轨道模板。
- 筛选栏只显示前几行、末尾固定放操作按钮时，用 `collapsed` 加 `suffix`。

### 基础用法

`span` 为跨越的轨道数，默认 `24`（超过轨道数时按整行，所以不写时在任何 `columns` 下都独占一行），`offset` 在左侧空出轨道，`span="auto"` 占满本行剩余；本行放不下时换行。`gap` 为 `[水平, 垂直]`，数字表示两个方向相同。

:::playground
<!-- <config lang="json5">{ previewInset: 24 }</config> -->
```vue
<template>
	<Grid :gap="[12, 8]">
		<GridItem :span="8"><div class="cell">span 8</div></GridItem>
		<GridItem :span="8" :offset="8"><div class="cell">span 8 · offset 8</div></GridItem>
		<GridItem :span="6"><div class="cell">span 6</div></GridItem>
		<GridItem span="auto"><div class="cell">auto</div></GridItem>
	</Grid>
</template>

<script setup>
import { Grid, GridItem } from '@deot/vc';
</script>

<style scoped>
.cell {
	height: 40px;
	line-height: 40px;
	text-align: center;
	background: var(--vc-background-color-light);
	border-radius: 4px;
}
</style>
```
:::

### 轨道模板

`columns` 为数字时是等宽列数。为数组时，数字项是固定 px，字符串项原样使用；为字符串时就是完整的 `grid-template-columns`。`span`、`offset` 按轨道数计算。

:::playground
<!-- <config lang="json5">{ previewInset: 24 }</config> -->
```vue
<template>
	<Grid :columns="[100, '1fr']" :gap="8">
		<GridItem :span="1"><div class="cell">100px</div></GridItem>
		<GridItem :span="1"><div class="cell">1fr</div></GridItem>
		<GridItem :span="2"><div class="cell">span 2</div></GridItem>
	</Grid>
</template>

<script setup>
import { Grid, GridItem } from '@deot/vc';
</script>

<style scoped>
.cell {
	height: 40px;
	line-height: 40px;
	text-align: center;
	background: var(--vc-background-color-light);
	border-radius: 4px;
}
</style>
```
:::

### 合并

`getSpan` 的写法同 Table：返回 `[rowspan, colspan]` 或 `{ rowspan, colspan }`。`colspan` 覆盖该项的 `span`，`rowspan` 为跨越的行数，任一为 `0` 时隐藏该项；返回 `undefined` 时使用该项自己的 `span`，占 1 行。后面的项会跳过已被占用的格子。

:::playground
<!-- <config lang="json5">{ previewInset: 24 }</config> -->
```vue
<template>
	<Grid :gap="8" :get-span="getSpan">
		<GridItem v-for="i in 6" :key="i" :span="6"><div class="cell">条目 {{ i }}</div></GridItem>
	</Grid>
</template>

<script setup>
import { Grid, GridItem } from '@deot/vc';

const getSpan = ({ index }) => (index === 0 ? [2, 6] : void 0);
</script>

<style scoped>
.cell {
	display: flex;
	height: 100%;
	min-height: 40px;
	background: var(--vc-background-color-light);
	border-radius: 4px;
	align-items: center;
	justify-content: center;
}
</style>
```
:::

### 对齐

`justify`、`align` 控制每项在自己格子内的对齐（`justify-items` / `align-items`），GridItem 上的同名属性覆盖单项（`justify-self` / `align-self`）。轨道没有占满宽度时（例如全部是固定 px），用 `justifyContent` 分布轨道。

### 响应式

`columns`、`gap`、`span`、`offset` 都可以写成 `{ xs, sm, md, lg, xl, xxl }`，按 **Grid 自身的宽度** 取值：取当前断点及更小断点中第一个已设置的值，都没有时用默认值。放在弹窗或侧栏中时同样准确。

| 断点 | xs | sm | md | lg | xl | xxl |
| --- | --- | --- | --- | --- | --- | --- |
| 宽度 | < 576 | ≥ 576 | ≥ 768 | ≥ 992 | ≥ 1200 | ≥ 1600 |

:::playground
<!-- <config lang="json5">{ previewInset: 24 }</config> -->
```vue
<template>
	<Grid :columns="{ xs: 1, sm: 2, md: 3, lg: 4 }" :gap="8">
		<GridItem v-for="i in 8" :key="i" :span="1"><div class="cell">条目 {{ i }}</div></GridItem>
	</Grid>
</template>

<script setup>
import { Grid, GridItem } from '@deot/vc';
</script>

<style scoped>
.cell {
	height: 40px;
	line-height: 40px;
	text-align: center;
	background: var(--vc-background-color-light);
	border-radius: 4px;
}
</style>
```
:::

### 折叠

`collapsed` 时只显示前 `collapsedRows` 行。`suffix` 项放在最后并靠右，折叠时预留在最后一行末尾；插槽参数 `overflow` 表示是否有项被隐藏。

:::playground
<!-- <config lang="json5">{ previewInset: 24 }</config> -->
```vue
<template>
	<Grid :collapsed="collapsed" :columns="3" :gap="[16, 12]">
		<GridItem v-for="i in 7" :key="i" :span="1"><Input :placeholder="`条目 ${i}`" /></GridItem>
		<GridItem :span="1" suffix justify="end">
			<template #default="{ overflow }">
				<Button @click="collapsed = !collapsed">{{ collapsed ? (overflow ? '展开' : '已全部显示') : '收起' }}</Button>
			</template>
		</GridItem>
	</Grid>
</template>

<script setup>
import { ref } from 'vue';
import { Button, Grid, GridItem, Input } from '@deot/vc';

const collapsed = ref(true);
</script>
```
:::

## 主题与局部覆盖

当前组件没有 CSS 主题参数，间距由 `gap` 设置。

## API

### Grid 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| columns | 列轨道。数字为等宽列数；数组中数字为固定 px、字符串原样使用；字符串为完整的 `grid-template-columns`。不支持 `auto-fill` / `auto-fit`（轨道数无法确定，开发环境会提示并按 1 次计算）。可写成响应式对象 | `number \| string \| (number \| string)[] \| Responsive` | - | `24` |
| gap | 间距 `[水平, 垂直]`，数字表示两个方向相同。可写成响应式对象 | `number \| [number, number] \| Responsive` | - | `0` |
| justify | 每项在格子内的水平对齐 | `string` | `start` / `center` / `end` / `stretch` | `stretch`（CSS 默认） |
| align | 每项在格子内的垂直对齐 | `string` | `start` / `center` / `end` / `stretch` / `baseline` | `stretch`（CSS 默认） |
| justifyContent | 轨道没有占满宽度时的整体分布 | `string` | `start` / `center` / `end` / `space-between` / `space-around` / `space-evenly` | - |
| collapsed | 只显示前 `collapsedRows` 行，第一个放不下的项及之后的项隐藏；`suffix` 项始终显示 | `boolean` | - | `false` |
| collapsedRows | 折叠时显示的行数 | `number` | - | `1` |
| getSpan | 合并，写法同 Table；`row` 为该项的属性（已补上默认值），`index` 为下标 | `({ row, index }) => [rowspan, colspan] \| { rowspan?, colspan? } \| undefined` | - | - |
| tag | 外层标签 | `string` | - | `'div'` |

`Responsive` 为 `{ xs?, sm?, md?, lg?, xl?, xxl? }`，各值的类型与该属性相同。

### Grid 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 放置 GridItem | - |

### GridItem 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| span | 跨越的轨道数，超过轨道数时按轨道数处理（所以默认值在任何 `columns` 下都是整行）；`auto` 占满本行剩余（遇到被占用的格子为止）。可写成响应式对象 | `number \| 'auto' \| Responsive` | - | `24`（整行） |
| offset | 左侧空出的轨道数。可写成响应式对象 | `number \| Responsive` | - | `0` |
| suffix | 放在最后并靠右；折叠时始终显示 | `boolean` | - | `false` |
| justify | 覆盖 Grid 的 `justify` | `string` | 同 Grid | - |
| align | 覆盖 Grid 的 `align` | `string` | 同 Grid | - |

### GridItem 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 内容 | `{ overflow }`：折叠时是否有项被隐藏 |

### 使用注意

- Grid 的默认插槽只渲染 GridItem（包括 `v-for`、`<template>` 中的 GridItem），其他节点会被忽略；被其他组件包裹的 GridItem 也不会渲染。
- 位置由 Grid 计算后写在每项的 `grid-row` / `grid-column` 上，不依赖浏览器的自动放置；GridItem 自身的 `class`、`style` 会保留。
- 只有用到响应式对象时才会监听 Grid 的尺寸，断点变化时才重新计算。
- `MGrid`、`MGridItem` 分别是 `Grid`、`GridItem` 的别名，使用同一实现与样式，可从 `@deot/vc` 导入。
