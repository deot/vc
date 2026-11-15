## 索引栏（IndexBar）

按分组（如 A–Z）展示列表，右侧侧栏快速定位，分组标题吸顶，滚动时高亮当前分组。

### 何时使用

用于通讯录、城市、品类等按首字母或类别分组的长列表。

### 基础用法

`data` 为分组数组，每个分组为 `{ value, label?, children? }`：侧栏显示 `value`，分组标题显示 `label`（不传时取 `value`），`children` 为分组内的各项（为空时只显示标题）。`v-model` 绑定当前分组的 `value`。

点按侧栏跳到对应分组；按住后上下拖动连续切换，拖动时显示当前分组的提示。滚动时，标题到达吸附线的分组为当前分组，吸顶标题随之更换，下一个标题到达时把它顶出。

:::playground
<!-- <config lang="json5">{ previewInset: 20 }</config> -->
```vue
<template>
	<p>当前分组：{{ current }}</p>
	<IndexBar v-model="current" :data="data" :height="360" style="border: 1px solid var(--vc-border-color);" />
</template>

<script setup>
import { ref } from 'vue';
import { IndexBar } from '@deot/vc';

const current = ref('A');
const data = Array.from({ length: 26 }, (_, i) => {
	const letter = String.fromCharCode(65 + i);
	return {
		value: letter,
		label: `${letter} 组`,
		children: Array.from({ length: 3 }, (__, j) => ({ label: `${letter} 项 ${j + 1}` }))
	};
});
</script>
```
:::

### 滚动方式

与 `Table` 相同，由 `height`、`maxHeight`、`virtualized` 决定，各方式的显示一致：

| 条件 | 渲染 | 滚动 |
| --- | --- | --- |
| `height` | 虚拟列表（`RecycleList`） | 自带 |
| 只设 `maxHeight` | `Scroller` | 自带 |
| 都不设 | 普通渲染 | 外部：最近的滚动祖先（含外层 `Scroller`），没有时为页面 |
| 都不设 + `virtualized` | 虚拟列表（`RecycleList` 外部滚动） | 外部 |

依靠外部滚动时，吸附线位于滚动容器可视区顶部下方 `offset` 处（如页面顶部有固定的导航栏，传入它的高度）。侧栏在 IndexBar 可见的那一段中垂直居中，滚到底部时跟着收缩；放不下全部分组时各项等比压缩。

吸顶标题与侧栏由 `Affix`（`fixed: false`，即 `position: sticky`）承载，所以 IndexBar 与滚动容器之间不能有 `overflow` 非 `visible` 的元素（包括不滚动的 `overflow: hidden`），否则不会吸附；只为裁剪内容时可改用 `overflow: clip`。

```vue
<template>
	<!-- 页面滚动，顶部有 48px 的固定栏；数据多时开启虚拟列表 -->
	<IndexBar v-model="current" :data="data" :offset="48" virtualized />
</template>
```

### 虚拟列表

虚拟列表一次构建全部行，跳转到任意分组都不需要等待；行渲染出来后按实际尺寸校正。分组标题的预估高度取样式中的默认值，项的预估高度用 `estimateSize`（默认为项的默认最小高度，桌面端 40px，`MIndexBar` 为 750 稿 108）；用默认插槽自定义了项的高度时，传入相近的值可以让滚动条从一开始就接近实际长度。

### 自定义内容

默认插槽渲染分组内的每一项（参数 `{ row, group, index }`，`index` 为项在分组内的下标），传入后不再套默认的项容器；`title` 渲染分组标题（行内与吸顶共用），`sidebar` 渲染侧栏的单项，`tip` 渲染拖动时的提示。

:::playground
<!-- <config lang="json5">{ previewInset: 20 }</config> -->
```vue
<template>
	<IndexBar :data="data" :height="360" style="border: 1px solid var(--vc-border-color);">
		<template #default="{ row, group }">
			<div class="index-bar-row">
				<span class="index-bar-row__avatar">{{ group.value }}</span>
				{{ row.label }}
			</div>
		</template>
		<template #title="{ group }">
			<strong>{{ group.label }}</strong>&nbsp;· {{ group.children.length }} 项
		</template>
		<template #sidebar="{ group, active }">
			<span :style="{ fontWeight: active ? 600 : 400 }">{{ group.value.toLowerCase() }}</span>
		</template>
	</IndexBar>
</template>

<script setup>
import { IndexBar } from '@deot/vc';

const data = Array.from({ length: 26 }, (_, i) => {
	const letter = String.fromCharCode(65 + i);
	return {
		value: letter,
		label: `${letter} 组`,
		children: Array.from({ length: 3 }, (__, j) => ({ label: `${letter} 项 ${j + 1}` }))
	};
});
</script>

<style scoped>
.index-bar-row {
	display: flex;
	align-items: center;
	gap: 12px;
	height: 48px;
	padding: 0 40px 0 16px;
}

.index-bar-row__avatar {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 28px;
	height: 28px;
	color: #fff;
	background: var(--vc-color-primary);
	border-radius: 50%;
}
</style>
```
:::

## 移动端

`MIndexBar` 的属性、事件、插槽、结构与 `IndexBar` 相同，根节点另有标记类 `.vcm-index-bar`。数字 `height`、`maxHeight`、`offset`、`estimateSize` 为 750 稿长度；尺寸按 750 稿设计，写为 `calc(var(--vc-rem) * n)`，随 `--vc-rem` 缩放（括号内为 375 宽下的 px）：

| 项 | 值 |
| --- | --- |
| 分组标题 | 高 48（24），字号 28（14），左右内边距 32（16） |
| 项 | 最小高 108（54），字号 32（16），细线分隔并左侧缩进 32（16），与 `MListItem` 一致 |
| 侧栏 | 字号 20（10），每项高 28（14）加上下 4（2），宽 52（26）；当前项为主色文字 |
| 拖动提示 | 96（48）见方，字号 48（24），圆角 8（4），居中于可见段 |

与桌面端的差异：桌面端侧栏的当前项为主色圆底白字，拖动提示是侧栏当前项左侧的圆形气泡；移动端拖动侧栏时页面不跟着滚动。

```vue
<template>
	<MIndexBar v-model="current" :data="data" />
</template>
```

## 主题与局部覆盖

全局参数通过 `--vc-<参数>` 配置，单个组件通过 `--vc-index-bar-<参数>` 覆盖。

### 全局

| 参数 | 使用位置 | 值 |
| --- | --- | --- |
| background-color-lightest | 根节点背景 | 亮色：`#FFFFFF`；暗色：`#252B3A` |
| background-color-light | 分组标题背景 | 亮色：`#F7F8FA`；暗色：`#2D3444` |
| color-dark-extralight | 分组标题、侧栏文字 | 亮色：`#909399`；暗色：`#B9B9B9` |
| color-dark-light | 项的文字 | 亮色：`#080F20`；暗色：`#E8E8E8` |
| color-primary | 侧栏当前项、悬停色，桌面端拖动提示背景 | `#456CF6` |
| color-contrast-light | 桌面端侧栏当前项文字、拖动提示文字 | `#FFFFFF` |
| color-neutral-light | 移动端项的分隔线 | 亮色：`#EDEFF1`；暗色：`#3B4354` |

### 局部

尺寸与侧栏、提示的配色写成局部变量 `--vc-index-bar-<键>`，桌面端的默认值见括号，`MIndexBar` 在 `.vcm-index-bar` 上覆盖：

| 键 | 说明 |
| --- | --- |
| title-height / title-padding / title-font-size | 分组标题的高（32px）、左右内边距（16px）、字号（12px） |
| title-background | 分组标题背景（`background-color-light`） |
| item-height / item-padding / item-padding-right / item-font-size | 默认项的最小高（40px）、内边距（8px 16px）、右内边距（16px，另加侧栏宽度）、字号（14px） |
| sidebar-width / sidebar-padding | 侧栏宽（24px）、上下内边距（4px 0） |
| sidebar-item-size / sidebar-item-padding / sidebar-item-gap / sidebar-item-radius / sidebar-font-size | 侧栏单项的尺寸（16px）、内边距（0）、上下间距（1px）、圆角（50%）、字号（11px） |
| sidebar-active-color / sidebar-active-background | 侧栏当前项的文字色（`color-contrast-light`）与背景（`color-primary`） |
| tip-size / tip-font-size / tip-radius / tip-gap | 拖动提示的尺寸（40px）、字号（20px）、圆角（50%）、与侧栏的间距（12px） |
| tip-color / tip-background | 拖动提示的文字色（`color-contrast-light`）与背景（`color-primary`） |

## API

### 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| modelValue | 当前分组的 `value`，支持 `v-model`；外部改值时滚动到该分组 | `string \| number` | - | 第一个分组 |
| data | 分组数据 | `IndexBarGroup[]` | - | `[]` |
| height | 固定高度：虚拟列表，自带滚动；数字为 px（`MIndexBar` 中为 750 稿长度），字符串原样作为 CSS 长度 | `number \| string` | - | - |
| maxHeight | 最大高度：`Scroller`，自带滚动；单位同 `height` | `number \| string` | - | - |
| virtualized | 不设高度（依靠外部滚动）时使用虚拟列表 | `boolean` | - | `false` |
| estimateSize | 虚拟列表中项的预估高度：数字或 `({ row, group, index }) => number \| undefined`；单位同 `height` | `number \| Function` | - | 项的默认最小高度 |
| sticky | 分组标题吸顶 | `boolean` | - | `true` |
| offset | 吸附线距滚动容器可视区顶部的距离，同 `Affix` 的 `offset`；单位同 `height` | `number \| string` | - | `0` |
| tip | 拖动侧栏时显示当前分组的提示 | `boolean` | - | `true` |

`IndexBarGroup`：

| 字段 | 说明 | 类型 |
| --- | --- | --- |
| value | 分组的标识（不可重复），侧栏显示它 | `string \| number` |
| label | 分组标题，默认取 `value` | `string` |
| children | 分组内的各项；对象项默认显示其 `label`，其余原样显示 | `unknown[]` |

### 事件

| 事件名 | 说明 | 回调参数 | 参数说明 |
| --- | --- | --- | --- |
| update:modelValue | 当前分组改变时更新绑定值 | `value: string \| number` | 分组的 `value` |
| change | 滚动、点按或拖动侧栏、调用 `scrollTo` 使当前分组改变时触发 | `value: string \| number` | 同上；外部赋值不触发 |

### 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 分组内的一项；传入后不再套默认的项容器 | `{ row: unknown, group: IndexBarGroup, index: number }` |
| title | 分组标题，行内与吸顶共用 | `{ group: IndexBarGroup }` |
| sidebar | 侧栏的单项 | `{ group: IndexBarGroup, active: boolean }` |
| tip | 拖动侧栏时的提示 | `{ group: IndexBarGroup }` |

### 方法

| 方法名 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| scrollTo | 滚动到分组（标题停在吸附线上），并设为当前分组；列表末尾到不了吸附线的分组也保持为当前分组 | `value: string \| number`，`options?: { duration?: number }`（动画时长，ms，默认 `0`） | `void` |
| refresh | 内容尺寸在组件之外变化后（如项内的图片加载完成）重新测量 | - | `void` |
